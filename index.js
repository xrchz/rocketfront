import { ethers } from './node_modules/ethers/dist/ethers.min.js'

const title = document.createElement('h1')
const accountLabel = document.createElement('label')
const rETHBalanceDiv = document.createElement('div')
const ETHBalanceDiv = document.createElement('div')
const walletSelectDiv = document.createElement('div')
const statusDiv = document.createElement('div')

title.innerText = 'Unofficial Rocket Pool Liquid Staking Interface'
statusDiv.innerText = 'loading...'

document.querySelector('body').append(
  title,
  accountLabel,
  rETHBalanceDiv,
  ETHBalanceDiv,
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
  ['function balanceOf(address) view returns (uint256)'],
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
  input.setAttribute('readonly', true)
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

window.ethereum.on('accountsChanged', connectBrowserAccount)

async function connectBrowserAccount() {
  // TODO: check accounts available, and if it is empty or the one already connected
  connectButton.disabled = true
  signer = await browserProvider.getSigner()
  accountInput.input.value = await signer.getAddress()
  accountInput.input.dispatchEvent(new Event('change'))
  accountInput.input.setAttribute('readonly', true)
}
// TODO: listen for wallet-initiated disconnect
// make accountInput writable again
// make connectButton enabled again

const connectButton = walletSelectDiv.appendChild(document.createElement('input'))
connectButton.type = 'button'
connectButton.value = 'Connect'
connectButton.addEventListener('click', () => {
  if (browserWalletRadio.checked)
    connectBrowserAccount()
  else {
    console.assert(walletConnectRadio.checked, `No walletSelect radio checked`)
    console.log(`WalletConnect not yet supported`) // TODO
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
provider.addListener('block', async () => {
  await updateBlockNumber()
  await updateBalances()
})

// TODO: form to mint rETH
// TODO: form to burn rETH

// TODO: show rETH approvals and option to revoke?

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
