import { isAddress } from 'viem'

export type VaultUiConfig = {
  chainId: number
  usdcAddress: `0x${string}`
  vaultAddress: `0x${string}`
  handlerAddress: `0x${string}`
  l1ReadAddress: `0x${string}`
  coreTokenIds: {
    usdc: number
    hype: number
    btc: number
  }
}

const CONFIG_KEY = 'axone:vault-config:v1'

// Valeurs par défaut
const DEFAULT_CONFIG: Partial<VaultUiConfig> = {
  chainId: 998, // HyperEVM Testnet
  usdcAddress: '0xd9CBEC81df392A88AEff575E962d149d57F4d6bc',
}

export function loadConfig(): VaultUiConfig | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (!stored) return null
    
    const config = JSON.parse(stored) as VaultUiConfig
    return validateConfig(config) ? config : null
  } catch {
    return null
  }
}

export function saveConfig(config: VaultUiConfig): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    if (!validateConfig(config)) return false
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function validateConfig(config: Partial<VaultUiConfig>): config is VaultUiConfig {
  return !!(
    config.chainId &&
    config.usdcAddress && isAddress(config.usdcAddress) &&
    config.vaultAddress && isAddress(config.vaultAddress) &&
    config.handlerAddress && isAddress(config.handlerAddress) &&
    config.l1ReadAddress && isAddress(config.l1ReadAddress) &&
    config.coreTokenIds &&
    typeof config.coreTokenIds.usdc === 'number' &&
    typeof config.coreTokenIds.hype === 'number' &&
    typeof config.coreTokenIds.btc === 'number'
  )
}

export function getDefaultConfig(): Partial<VaultUiConfig> {
  return { ...DEFAULT_CONFIG }
}

export function clearConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONFIG_KEY)
  }
}

/**
 * Configuration utilisable côté serveur (API routes)
 * Utilise les variables d'environnement ou retourne des valeurs par défaut
 */
export function getConfigForApi(): Partial<VaultUiConfig> {
  const envConfig: Partial<VaultUiConfig> = {
    chainId: 998, // HyperEVM Testnet
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined,
    vaultAddress: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined,
    handlerAddress: process.env.NEXT_PUBLIC_HANDLER_ADDRESS as `0x${string}` | undefined,
    l1ReadAddress: process.env.NEXT_PUBLIC_L1_READ_ADDRESS as `0x${string}` | undefined,
  }

  // Si les adresses sont définies dans l'env, utiliser la config complète
  if (validateConfig(envConfig)) {
    return envConfig
  }

  // Sinon retourner les valeurs par défaut
  return {
    ...DEFAULT_CONFIG,
    vaultAddress: process.env.NEXT_PUBLIC_VAULT_ADDRESS as `0x${string}` | undefined,
    handlerAddress: process.env.NEXT_PUBLIC_HANDLER_ADDRESS as `0x${string}` | undefined,
  }
}