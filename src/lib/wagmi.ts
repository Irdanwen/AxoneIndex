import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'
import { injected } from 'wagmi/connectors'

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
});

export const config = createConfig({
  chains: [hyperEVM],
  connectors: [
    injected()
  ],
  transports: {
    [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0])
  }
})

