import { Vault } from './vaultTypes'

export const MOCK_VAULTS: Vault[] = [
  {
    id: '1',
    name: 'UnusVault',
    tvl: 2450000,
    tokens: [
      { symbol: 'BTC', percentage: 35 },
      { symbol: 'AXN', percentage: 35 },
      { symbol: 'UETH', percentage: 15 },
      { symbol: 'USOL', percentage: 10 },
      { symbol: 'HYPE', percentage: 5 }
    ],
    userDeposit: 500,
    performance30d: 4.2,
    status: 'open',
    risk: 'medium',
    contractAddress: '',
    usdcAddress: ''
  },
  {
    id: '2',
    name: 'StableYield',
    tvl: 1800000,
    tokens: [
      { symbol: 'USDC', percentage: 70 },
      { symbol: 'DAI', percentage: 30 }
    ],
    userDeposit: 0,
    performance30d: 1.8,
    status: 'open',
    risk: 'low',
    contractAddress: '',
    usdcAddress: ''
  },
  {
    id: '3',
    name: 'DeFi Growth',
    tvl: 3200000,
    tokens: [
      { symbol: 'ETH', percentage: 40 },
      { symbol: 'UNI', percentage: 25 },
      { symbol: 'AAVE', percentage: 20 },
      { symbol: 'COMP', percentage: 15 }
    ],
    userDeposit: 1200,
    performance30d: 8.5,
    status: 'open',
    risk: 'high',
    contractAddress: '',
    usdcAddress: ''
  },
  {
    id: '4',
    name: 'Conservative',
    tvl: 950000,
    tokens: [
      { symbol: 'USDC', percentage: 50 },
      { symbol: 'USDT', percentage: 30 },
      { symbol: 'DAI', percentage: 20 }
    ],
    userDeposit: 250,
    performance30d: 0.8,
    status: 'paused',
    risk: 'low',
    contractAddress: '',
    usdcAddress: ''
  }
]
