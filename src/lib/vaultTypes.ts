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
  // Adresse du smart contract du vault (BTC50 Defensive)
  contractAddress?: string
  // Adresse du token USDC utilisé pour les dépôts (8 décimales)
  usdcAddress?: string
}
