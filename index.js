import { ethers } from './node_modules/ethers/dist/ethers.min.js'
import wcPkg from "https://esm.run/@walletconnect/ethereum-provider/dist/index.umd.js"
const EthereumProvider = wcPkg.EthereumProvider

const walletConnectProjectId = 'b0865b6ca065423e47b7d6dffa2f5e18'

const title = document.createElement('h1')
const accountLabel = document.createElement('label')
const rETHBalanceDiv = document.createElement('div')
const ETHBalanceDiv = document.createElement('div')
const rETHHistoryDiv = document.createElement('div')
const rETHPricesDiv = document.createElement('div')
const walletSelectDiv = document.createElement('div')
const statusDiv = document.createElement('div')

title.innerText = 'Unofficial Rocket Pool Liquid Staking Interface'
statusDiv.innerText = 'loading...'

document.querySelector('body').append(
  title,
  accountLabel,
  rETHBalanceDiv,
  ETHBalanceDiv,
  rETHHistoryDiv,
  rETHPricesDiv,
  walletSelectDiv,
  statusDiv
)

let browserProvider = new ethers.BrowserProvider(window.ethereum)
let signer

let provider = new ethers.FallbackProvider([
  browserProvider,
  ethers.getDefaultProvider('mainnet')])
// TODO: make network configurable
// TODO: allow custom RPC?

const rocketStorageAddress = await provider.resolveName('rocketstorage.eth')
const rocketStorage = new ethers.Contract(rocketStorageAddress,
  ['function getAddress(bytes32) view returns (address)'],
  provider)
const getRocketAddress = name => rocketStorage['getAddress(bytes32)'](ethers.id(`contract.address${name}`))
const rocketToken = new ethers.Contract(await getRocketAddress('rocketTokenRETH'),
  ['function balanceOf(address) view returns (uint256)',
   'function allowance(address owner, address spender) view returns (uint256)',
   'function getExchangeRate() view returns (uint256)'],
  provider)

function createAddressInput() {
  const div = document.createElement('div')
  const input = document.createElement('input')
  const span = document.createElement('span')
  div.classList.add('address')
  div.appendChild(input)
  div.appendChild(span)
  input.addEventListener('change', async () => {
    let resolve
    input.theAddress = new Promise(x => resolve = x)
    span.innerText = 'loading...'
    input.value = input.value.trim()
    const {address, ensName} = ethers.isAddress(input.value) ?
      {address: input.value,
       ensName: await provider.lookupAddress(input.value).catch(e => e)} :
      {address: await provider.resolveName(input.value).catch(e => e),
       ensName: input.value}
    input.setCustomValidity('')
    if (ethers.isAddress(address)) {
      const checksummedAddress = ethers.getAddress(address)
      resolve(checksummedAddress)
      if (typeof ensName == 'string') {
        input.value = ensName
        input.classList.remove('address')
        span.innerText = checksummedAddress
        span.appendChild(document.createTextNode(' '))
      }
      else {
        input.value = checksummedAddress
        input.classList.add('address')
        span.innerText = ''
      }
      const a = span.appendChild(document.createElement('a'))
      a.innerText = '📋'
      a.addEventListener('click', () => {
        navigator.clipboard.writeText(checksummedAddress)
        a.innerText = 'copied!'
        setTimeout(() => a.innerText = '📋', 696)
      }, {passive: true})
    }
    else {
      if (typeof ensName == 'string' && ensName.endsWith('.eth'))
        span.innerText = `No address found for ${ensName}`
      else if (input.value != '')
        span.innerText = 'Checksummed address (0x69Fe...) or ENS name (amy.eth)'
      else
        span.innerText = ''
      input.classList.remove('address')
      input.setCustomValidity('Need Ethereum address or ENS name')
      resolve()
    }
  }, {passive: true})
  return {div, input}
}

accountLabel.innerText = 'Account: '
const accountInput = createAddressInput()

accountLabel.appendChild(accountInput.div)

function createBalanceDiv(div, token) {
  const label = div.appendChild(document.createElement('label'))
  label.innerText = `${token} balance: `
  const input = div.appendChild(document.createElement('input'))
  const span = div.appendChild(document.createElement('span'))
  input.type = 'text'
  input.setAttribute('readonly', '')
  div.classList.add('balance')
  return {input, span}
}

const {input: rETHBalanceInput, span: rETHBalanceSpan} = createBalanceDiv(rETHBalanceDiv, 'rETH')
const {input: ETHBalanceInput, span: ETHBalanceSpan} = createBalanceDiv(ETHBalanceDiv, 'ETH')

async function updateBalances() {
  rETHBalanceSpan.innerText = 'loading...'
  ETHBalanceSpan.innerText = 'loading...'
  const address = await accountInput.input.theAddress
  if (address) {
    const rETHBalance = await rocketToken.balanceOf(address)
    const ETHBalance = await provider.getBalance(address)
    rETHBalanceInput.value = ethers.formatEther(rETHBalance)
    ETHBalanceInput.value = ethers.formatEther(ETHBalance)
  }
  else {
    rETHBalanceInput.value = ''
    ETHBalanceInput.value = ''
  }
  rETHBalanceSpan.innerText = ''
  ETHBalanceSpan.innerText = ''
}

accountInput.input.addEventListener('change', updateBalances, {passive: true})

// TODO: display rETH history and profits
// - use IndexedDB to cache the data needed

walletSelectDiv.classList.add('wallet')
const browserWalletLabel = walletSelectDiv.appendChild(document.createElement('label'))
const browserWalletRadio = document.createElement('input')
const walletConnectLabel = walletSelectDiv.appendChild(document.createElement('label'))
const walletConnectRadio = document.createElement('input')
walletConnectLabel.innerText = 'WalletConnect'
browserWalletLabel.innerText = 'Browser'
walletConnectLabel.appendChild(walletConnectRadio)
browserWalletLabel.appendChild(browserWalletRadio)
walletConnectRadio.type = 'radio'
browserWalletRadio.type = 'radio'
walletConnectRadio.name = 'wallet'
browserWalletRadio.name = 'wallet'
browserWalletRadio.checked = true
// TODO: also disable switching radio when connected

window.ethereum.on('accountsChanged', connectBrowserAccount)

// TODO: enumerate accountInput states and update on state transition?

async function connectBrowserAccount(accounts) {
  accounts = await accounts
  if (!accounts.length) {
    connectButton.disabled = false
    accountInput.input.value = ''
    accountInput.input.dispatchEvent(new Event('change'))
    accountInput.input.removeAttribute('readonly')
  }
  else if (accounts[0] !== accountInput.input.value) {
    connectButton.disabled = true
    signer = await browserProvider.getSigner()
    accountInput.input.value = await signer.getAddress()
    accountInput.input.dispatchEvent(new Event('change'))
    accountInput.input.setAttribute('readonly', '')
  }
  else {
    // TODO: any checks required if account has not changed?
  }
}

const wcEthereum = await EthereumProvider.init({
  projectId: walletConnectProjectId,
  chains: [1], // TODO: add other chains as needed
  showQrModal: false,
  methods: ["eth_sendTransaction", "personal_sign"],
  events: ["chainChanged", "accountsChanged"],
})

const connectButton = walletSelectDiv.appendChild(document.createElement('input'))
connectButton.type = 'button'
connectButton.value = 'Connect'
connectButton.addEventListener('click', () => {
  if (browserWalletRadio.checked)
    connectBrowserAccount(
      window.ethereum.request({method: 'eth_requestAccounts', params: []})
    )
  else {
    console.assert(walletConnectRadio.checked, `No walletSelect radio checked`)
    wcEthereum.request({method: 'eth_requestAccounts'}) // TODO: handle result
  }
})

statusDiv.classList.add('status')
statusDiv.innerText = ''
// TODO: make statusConnected a network selector instead
// TODO: update it if the provider disconnects
const statusConnected = statusDiv.appendChild(document.createElement('span'))
const statusBlockNumber = statusDiv.appendChild(document.createElement('span'))
async function updateBlockNumber() {
  statusBlockNumber.innerText = await provider.getBlockNumber().then(n => n.toString())
}
await updateBlockNumber()
statusConnected.innerText = await provider.getNetwork().then(n => n.name)
// TODO: add toggle for auto-updating block (+ dependents)
// TODO: add button for manual update (when auto is off)

const rocketSwapRouterAddress = '0x16d5a408e807db8ef7c578279beeee6b228f1c1c' // TODO: alternative for other networks
const rocketSwapRouter = new ethers.Contract(rocketSwapRouterAddress,
  ['function swapTo(uint256 _uni, uint256 _bal, uint256 _min, uint256 _ideal) payable',
   'function swapFrom(uint256 _uni, uint256 _bal, uint256 _min, uint256 _ideal, uint256 _in)',
   'function optimiseSwapTo(uint256 _in, uint256 _steps) view returns (uint256[2] _portions, uint256 _out)',
   'function optimiseSwapFrom(uint256 _in, uint256 _steps) view returns (uint256[2] _portions, uint256 _out)',
   'function uniswapQuoter() view returns (address)',
   'function WETH() view returns (address)'],
  provider)

// TODO: show rETH ratios (primary and secondary)
const uniswapQuoter = new ethers.Contract(await rocketSwapRouter.uniswapQuoter(),
  ['function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 priceLimit) returns (uint256)'],
  provider)
const WETH = await rocketSwapRouter.WETH()
const uniswapFee = 500
const oneEther = ethers.parseEther('1')
const primaryPriceSpan = document.createElement('span')
const secondaryPriceSpan = document.createElement('span')
rETHPricesDiv.classList.add('prices')
rETHPricesDiv.append(primaryPriceSpan, secondaryPriceSpan)
async function updatePrices() {
  primaryPriceSpan.innerText += ' loading...'
  secondaryPriceSpan.innerText += ' loading...'
  const primaryPrice = await rocketToken.getExchangeRate()
  primaryPriceSpan.innerText = `Primary: 1 rETH = ${ethers.formatEther(primaryPrice)} ETH`
  const secondaryPrice = await uniswapQuoter.quoteExactInputSingle.staticCall(
    await rocketToken.getAddress(), WETH, uniswapFee, oneEther, 0)
  secondaryPriceSpan.innerText = `Uniswap: 1 rETH = ${ethers.formatEther(secondaryPrice)} ETH`
  // TODO: display premium/discount %
  // TODO: allow swapping direction?
  // TODO: put numbers in readonly inputs?
}
await updatePrices()

provider.addListener('block', async () => {
  await updateBlockNumber()
  await updateBalances()
  await updatePrices()
})

wcEthereum.on('connect', (x) => console.log(`wcEthereum connected ${x}`))

try {
  await wcEthereum.connect()
}
catch (err) {
  console.error(err)
}

// TODO: form to mint (stake ETH) rETH
// TODO: form to burn (unstake ETH) rETH
// TODO: allowance of swap contract for rETH when unstaking
// preview amounts swapped via which routes, fees and gas fees etc.

// TODO: show all rETH allowances and option to revoke?

// TODO: display NO status

// account under consideration (can be the connected one, or other custom)
// connected account (if any)
// connected provider (can be from browser / connected account, or custom RPC)
// liquid staker info (as below)
// info if a NO or minipool or withdrawal or whatever

// liquid stakers / any wallet:
// rETH mint
// rETH burn
// previews for the above
// info on deposit pool current status?
// gas and economical viability estimation for the above
// rETH staking returns historical view
// rETH staking returns projection estimator

// requiring a node (leave for later / separate site):
// withdrawal address confirmation (and view)
// stake on behalf
// stake on behalf allowlist management? or at least view?
// RPL v1->v2 migration
