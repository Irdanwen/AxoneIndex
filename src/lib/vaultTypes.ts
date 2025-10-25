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
  // Adresse du smart contract du vault (STRATEGY_1)
  contractAddress?: string
  // Adresse du token HYPE utilisé pour les dépôts (18 décimales)
  usdcAddress?: string
}
