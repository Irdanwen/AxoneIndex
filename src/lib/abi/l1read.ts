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
  },
  {
    type: 'function',
    name: 'tokenInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'token', type: 'uint32' }
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'name', type: 'string' },
          { name: 'spots', type: 'uint64[]' },
          { name: 'deployerTradingFeeShare', type: 'uint64' },
          { name: 'deployer', type: 'address' },
          { name: 'evmContract', type: 'address' },
          { name: 'szDecimals', type: 'uint8' },
          { name: 'weiDecimals', type: 'uint8' },
          { name: 'evmExtraWeiDecimals', type: 'int8' }
        ]
      }
    ]
  }
] as const
