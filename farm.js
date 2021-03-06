const {template} = require("./template")
const Web3EthContract = require('web3-eth-contract');
const ERC20ABI = require('./ERC20.json')
const BigNumber = require('bignumber.js')

// Web3EthContract.setProvider('wss://bsc-ws-node.nariox.org:443');
Web3EthContract.setProvider('https://bsc-dataseed.binance.org');

const yearCakes = 420480000

const getBalanceNumber = (balance, decimals = 18) => {
  const displayBalance = balance.dividedBy(new BigNumber(10).pow(decimals))
  return displayBalance.toNumber()
}

const getBnbPrice = async () => {
  const wbnb = new Web3EthContract(ERC20ABI.abi, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  const bnbAmount = await wbnb.methods.balanceOf('0x1b96b92314c44b159149f7e0303511fb2fc4774f').call()
  const wbusd = new Web3EthContract(ERC20ABI.abi, '0xe9e7cea3dedca5984780bafc599bd69add087d56');
  const busdAmount = await wbusd.methods.balanceOf('0x1b96b92314c44b159149f7e0303511fb2fc4774f').call()

  return getBalanceNumber(new BigNumber(busdAmount))/getBalanceNumber(new BigNumber(bnbAmount))
}

const getCakePrice = async () => {
  const wbnb = new Web3EthContract(ERC20ABI.abi, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  const bnbAmount = await wbnb.methods.balanceOf('0xA527a61703D82139F8a06Bc30097cC9CAA2df5A6').call()
  const wcake = new Web3EthContract(ERC20ABI.abi, '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82');
  const cakeAmount = await wcake.methods.balanceOf('0xA527a61703D82139F8a06Bc30097cC9CAA2df5A6').call()
  const bnbPrice = await getBnbPrice()

  return getBalanceNumber(new BigNumber(bnbAmount)) / getBalanceNumber(new BigNumber(cakeAmount)) * bnbPrice
}

getStakingAmount = async () => {
  const syrupSupply = new Web3EthContract(ERC20ABI.abi, '0x009cf7bc57584b7998236eff51b98a168dcea9b0');
  const supply = getBalanceNumber(new BigNumber(await syrupSupply.methods.totalSupply().call()))
  return supply
}

const lpAddress = [
  "0xA527a61703D82139F8a06Bc30097cC9CAA2df5A6", // CAKE
  "0x1b96b92314c44b159149f7e0303511fb2fc4774f", // BUSD
  "0xba51d1ab95756ca4eab8737ecd450cd8f05384cf", // ADA
  "0xc639187ef82271d8f517de6feae4faf5b517533c", // BAND
  "0xbcd62661a6b1ded703585d3af7d7649ef4dcdb5c", // DOT
  "0x981d2ba1b298888408d342c39c2ab92e8991691e", // EOS
  "0xaebe45e3a03b734c68e5557ae04bfc76917b4686", // LINK
  "0xc2eed0f5a0dc28cfa895084bc0a9b8b8279ae492", // BAKE
  "0xd937FB9E6e47F3805981453BFB277a49FFfE04D7", // BURGER
]


// exports.handler = async (event) => {
exports.farm = async (event) => {
  let data = template.pools

  const wbnb = new Web3EthContract(ERC20ABI.abi, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');
  const lpContract1 = new Web3EthContract(ERC20ABI.abi, '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c');

  const bnbprice = await getBnbPrice()
  const cakeprice = await getCakePrice()
  const stakingAmount = await getStakingAmount()

  console.log(bnbprice)
  console.log(cakeprice)
  console.log(stakingAmount)

  data[0].apr = data[0].points / 76 * yearCakes / stakingAmount

  const promises = lpAddress.map(async (lp, index) => {
    const lpamout = await wbnb.methods.balanceOf(lp).call()
    let totalStaked = getBalanceNumber(new BigNumber(lpamout)) * bnbprice * 2
    const apy = data[index + 1].points / 76 * yearCakes * cakeprice / totalStaked
    if (index == 8) {
      const bakelp = new Web3EthContract(ERC20ABI.abi, '0xc2Eed0F5a0dc28cfa895084bC0a9B8B8279aE492');
      const lpamout = getBalanceNumber(new BigNumber(await bakelp.methods.balanceOf('0x73feaa1eE314F8c655E354234017bE2193C9E24E').call()))
      const supply = getBalanceNumber(new BigNumber(await bakelp.methods.totalSupply().call()))
      console.log(lpamout / supply)
      totalStaked = totalStaked * lpamout / supply
    }
    data[index + 1].totalStaked = totalStaked
    data[index + 1].apr = apy
  })

  await Promise.all(promises)

  return {...template, pools: data}

}
