import { createPublicClient, createWalletClient, isAddress, getAddress, fallback, http, custom } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const localTransport = http('http://localhost:8545')
const infura = http('https://mainnet.infura.io/v3/c6485f444d4f4102866edf0f8d932cf5')
const alchemy = http('https://eth-mainnet.g.alchemy.com/v2/UQbReQ5UxSIDIal3NsSbfS2LsGoo7LDo')

function normalise(name) {
  try {
    return normalize(name)
  }
  catch {
    return null
  }
}

const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    custom({request (args) { return window.ethereum.request(args) }}),
    localTransport,
    alchemy,
    infura,
  ])
})

function createAddressInput() {
  const div = document.createElement('div')
  const input = document.createElement('input')
  const span = document.createElement('span')
  div.classList.add('address')
  div.appendChild(input)
  div.appendChild(span)
  input.addEventListener('change', async () => {
    span.innerText = 'processing...'
    input.value = input.value.trim()
    const {address, ensName} = isAddress(input.value) ?
      {address: input.value,
        ensName: await publicClient.getEnsName({address: getAddress(input.value)}).catch(e => e)} :
      {address: await publicClient.getEnsAddress({name: normalise(input.value)}).catch(e => e),
       ensName: input.value}
    input.setCustomValidity('')
    if (isAddress(address)) {
      if (typeof ensName == 'string') {
        // TODO: should we really be swapping out what they wrote? but typing an address manually will be rare. swapping a paste seems ok.
        input.value = ensName
        input.classList.remove('address')
        span.innerText = getAddress(address)
      }
      else {
        input.value = getAddress(address)
        input.classList.add('address')
        span.innerText = `(debug: no ens; got ${ensName})` // TODO: ''
      }
      // TODO: add (activate) copy button for address
    }
    else {
      if (typeof ensName == 'string' && ensName.endsWith('.eth'))
        span.innerText = `No address found for ${ensName}`
      else
        span.innerText = 'Enter address (0x69Fed420...) or ENS name (eatme.eth)'
      input.classList.remove('address')
      input.setCustomValidity('Need Ethereum address or ENS name')
    }
  })
  return div
}

const accountInput = createAddressInput()

const body = document.querySelector('body')
body.appendChild(accountInput)

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
