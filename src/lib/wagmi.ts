import { createConfig, http, defineChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'

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
  chains: [sepolia, hyperEVM],
  transports: {
    [sepolia.id]: http(),
    [hyperEVM.id]: http(hyperEVM.rpcUrls.default.http[0])
  }
})

