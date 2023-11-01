import { ethers } from 'ethers'

const browserProvider = new ethers.BrowserProvider(window.ethereum)

const provider = new ethers.FallbackProvider([
  browserProvider,
  ethers.getDefaultProvider('mainnet')])

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

const accountLabel = document.createElement('label')
accountLabel.innerText = 'Account: '
const accountInput = createAddressInput()

const body = document.querySelector('body')
accountLabel.appendChild(accountInput.div)

const rETHBalanceDiv = document.createElement('div')
const rETHBalanceLabel = rETHBalanceDiv.appendChild(document.createElement('label'))
rETHBalanceLabel.innerText = 'rETH balance: '
const rETHBalanceInput = rETHBalanceDiv.appendChild(document.createElement('input'))
rETHBalanceInput.type = 'text'
rETHBalanceInput.setAttribute('readonly', true)
rETHBalanceDiv.classList.add('balance')

const ETHBalanceDiv = document.createElement('div')
const ETHBalanceLabel = ETHBalanceDiv.appendChild(document.createElement('label'))
ETHBalanceLabel.innerText = 'ETH balance: '
const ETHBalanceInput = ETHBalanceDiv.appendChild(document.createElement('input'))
ETHBalanceInput.type = 'text'
ETHBalanceDiv.classList.add('balance')
ETHBalanceInput.setAttribute('readonly', true)

async function updateBalances() {
  rETHBalanceInput.value = 'loading...'
  ETHBalanceInput.value = 'loading...'
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
}

accountInput.input.addEventListener('change', updateBalances, {passive: true})

// TODO: display rETH history and profits
// probably need to use a real server for that, so we can cache info server-side
// and also try to forward the server's RPC as a fallback option

const walletSelectDiv = document.createElement('div')
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

const connectButton = walletSelectDiv.appendChild(document.createElement('input'))
connectButton.type = 'button'
connectButton.value = 'Connect'
connectButton.addEventListener('click', () => {

})
// TODO: make button connect account

const statusDiv = document.createElement('div')
statusDiv.classList.add('status')
const statusConnected = statusDiv.appendChild(document.createElement('span'))
const statusBlockNumber = statusDiv.appendChild(document.createElement('span'))
statusConnected.innerText = await provider.getNetwork().then(n => n.name)
provider.addListener('block', async () => {
  await updateBalances()
  statusBlockNumber.innerText = await provider.getBlockNumber().then(n => n.toString())
})

// TODO: form to mint rETH
// TODO: form to burn rETH

// TODO: display NO status

body.append(
  accountLabel,
  rETHBalanceDiv,
  ETHBalanceDiv,
  walletSelectDiv,
  statusDiv
)

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
