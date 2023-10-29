import { ethers } from 'ethers'

const provider = new ethers.FallbackProvider([
  new ethers.BrowserProvider(window.ethereum),
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
    span.innerText = 'processing...'
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
      else
        span.innerText = 'Enter checksummed address (0x69Fed420...) or ENS name (eatme.eth)'
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
body.appendChild(accountLabel)
accountLabel.appendChild(accountInput.div)

const balanceDiv = body.appendChild(document.createElement('div'))
const balanceLabel = balanceDiv.appendChild(document.createElement('label'))
balanceLabel.innerText = 'rETH balance: '
const balanceInput = balanceDiv.appendChild(document.createElement('input'))
balanceInput.setAttribute('readonly', true)

accountInput.input.addEventListener('change', async () => {
  const address = await accountInput.input.theAddress
  if (address) {
    const rETHBalance = await rocketToken.balanceOf(address)
    balanceInput.value = ethers.formatEther(rETHBalance)
  }
  else {
    balanceInput.value = ''
  }
}, {passive: true})

// TODO: display rETH history and profits

// TODO: button to connect account
// TODO: form to mint rETH
// TODO: form to burn rETH

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
