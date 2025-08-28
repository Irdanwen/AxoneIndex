// Minimal ABI pour interagir avec le VaultContract BTC50 Defensive
// Fonctions utilisées: deposit(uint64), withdraw(uint256), pps1e18() view, balanceOf(address) view
export const vaultContractAbi = [
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount1e6', type: 'uint64' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'pps1e18',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  }
] as const


