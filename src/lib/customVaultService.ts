import { Vault } from './vaultTypes'

const API_ENDPOINT = '/api/custom-vaults'

type VaultIdentifier = string | string[] | undefined

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

const ensureVaultArray = (payload: unknown): Vault[] => {
  if (!Array.isArray(payload)) {
    throw new Error('La réponse du serveur est invalide.')
  }

  const vaults = payload.filter(isVault)
  if (vaults.length !== payload.length) {
    throw new Error('Certaines données de vaults sont invalides.')
  }

  return vaults
}

const request = async <T>(input: RequestInfo, init?: RequestInit, mapper?: (data: unknown) => T): Promise<T> => {
  try {
    const response = await fetch(input, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {})
      }
    })

    if (!response.ok) {
      const message = await extractErrorMessage(response)
      throw new Error(message)
    }

    const data = (await response.json()) as unknown
    return mapper ? mapper(data) : (data as T)
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Impossible d'accéder aux vaults personnalisés.")
  }
}

const extractErrorMessage = async (response: Response) => {
  try {
    const body = (await response.json()) as { error?: string }
    if (body?.error) return body.error
  } catch {
    // ignore JSON parsing errors
  }
  return `La requête a échoué avec le statut ${response.status}.`
}

export const listCustomVaults = async (): Promise<Vault[]> =>
  request(API_ENDPOINT, { method: 'GET', cache: 'no-store' }, ensureVaultArray)

export const saveCustomVault = async (vault: Vault): Promise<Vault[]> =>
  request(
    API_ENDPOINT,
    {
      method: 'PUT',
      body: JSON.stringify(vault),
      cache: 'no-store'
    },
    ensureVaultArray
  )

export const deleteCustomVault = async (id?: VaultIdentifier): Promise<Vault[]> => {
  const params = new URLSearchParams()

  if (typeof id === 'string') {
    params.set('id', id)
  } else if (Array.isArray(id)) {
    id.forEach(value => params.append('id', value))
  }

  const url = params.toString() ? `${API_ENDPOINT}?${params.toString()}` : API_ENDPOINT

  return request(
    url,
    {
      method: 'DELETE',
      cache: 'no-store'
    },
    ensureVaultArray
  )
}
