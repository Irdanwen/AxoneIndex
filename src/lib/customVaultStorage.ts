import { Vault } from './vaultTypes'

export const CUSTOM_VAULTS_STORAGE_KEY = 'axone:custom-vaults:v1'

const isVaultToken = (value: unknown): value is { symbol: string; percentage: number } => {
  if (!value || typeof value !== 'object') return false
  const token = value as { symbol?: unknown; percentage?: unknown }
  return typeof token.symbol === 'string' && typeof token.percentage === 'number'
}

const isVault = (value: unknown): value is Vault => {
  if (!value || typeof value !== 'object') return false
  const vault = value as Partial<Vault>

  return (
    typeof vault.id === 'string' &&
    typeof vault.name === 'string' &&
    typeof vault.tvl === 'number' &&
    Array.isArray(vault.tokens) &&
    vault.tokens.every(isVaultToken) &&
    typeof vault.userDeposit === 'number' &&
    typeof vault.performance30d === 'number' &&
    (vault.status === 'open' || vault.status === 'closed' || vault.status === 'paused') &&
    (vault.risk === 'low' || vault.risk === 'medium' || vault.risk === 'high')
  )
}

const readStorage = (): Vault[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_VAULTS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isVault)
  } catch {
    return []
  }
}

const writeStorage = (vaults: Vault[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(CUSTOM_VAULTS_STORAGE_KEY, JSON.stringify(vaults))
  } catch {
    // ignore write errors (storage full, disabled, etc.)
  }
}

const normaliseVault = (vault: Vault): Vault => ({
  ...vault,
  id: vault.id.trim(),
  name: vault.name.trim(),
  tvl: Number.isFinite(vault.tvl) ? vault.tvl : 0,
  userDeposit: Number.isFinite(vault.userDeposit) ? vault.userDeposit : 0,
  performance30d: Number.isFinite(vault.performance30d) ? vault.performance30d : 0,
  tokens: vault.tokens
    .filter(token => token.symbol.trim())
    .map(token => ({
      symbol: token.symbol.trim().toUpperCase(),
      percentage: Number.isFinite(token.percentage) ? token.percentage : 0
    }))
})

export const loadCustomVaults = (): Vault[] => readStorage()

export const saveCustomVaults = (vaults: Vault[]): Vault[] => {
  const cleaned = vaults.map(normaliseVault)
  writeStorage(cleaned)
  return cleaned
}

export const upsertCustomVault = (vault: Vault): Vault[] => {
  const current = readStorage()
  const cleaned = normaliseVault(vault)
  const index = current.findIndex(existing => existing.id === cleaned.id)

  if (index >= 0) {
    current[index] = cleaned
  } else {
    current.push(cleaned)
  }

  writeStorage(current)
  return current
}

export const deleteCustomVault = (vaultId: string): Vault[] => {
  const current = readStorage()
  const updated = current.filter(vault => vault.id !== vaultId)
  writeStorage(updated)
  return updated
}
