export interface VaultToken {
  symbol: string
  percentage: number
}

export interface Vault {
  id: string
  name: string
  tvl: number
  tokens: VaultToken[]
  userDeposit: number
  performance30d: number
  status: 'open' | 'closed' | 'paused'
  risk: 'low' | 'medium' | 'high'
}
