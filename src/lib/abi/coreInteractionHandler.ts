// ABI minimale pour CoreInteractionHandler
export const coreInteractionHandlerAbi = [
  {
    type: 'function',
    name: 'usdcCoreTokenId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }]
  },
  {
    type: 'function',
    name: 'spotTokenBTC',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }]
  },
  {
    type: 'function',
    name: 'spotTokenHYPE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint64' }]
  },
  {
    type: 'function',
    name: 'l1read',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const