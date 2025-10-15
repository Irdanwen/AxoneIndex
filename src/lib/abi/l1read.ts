// ABI minimale pour L1Read
export const l1readAbi = [
  {
    type: 'function',
    name: 'spotBalance',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'uint64' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'total', type: 'uint64' },
          { name: 'hold', type: 'uint64' },
          { name: 'entryNtl', type: 'uint64' }
        ]
      }
    ]
  }
] as const