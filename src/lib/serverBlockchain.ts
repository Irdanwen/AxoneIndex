import { createPublicClient, http } from 'viem'
import { defineChain } from 'viem'

// Définition du réseau HyperEVM
const hyperEVM = defineChain({
  id: 998,
  name: 'HyperEVM Testnet',
  network: 'hyperliquid-testnet',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid-testnet.xyz/evm'],
    },
  },
  testnet: true,
})

let publicClient: ReturnType<typeof createPublicClient> | null = null

/**
 * Retourne un client viem public pour lire les données de la blockchain côté serveur
 */
export function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: hyperEVM,
      transport: http(hyperEVM.rpcUrls.default.http[0]),
    })
  }
  return publicClient
}

