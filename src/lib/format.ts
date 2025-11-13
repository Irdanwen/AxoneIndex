import { formatUnits, parseUnits } from 'viem'

export function formatUnitsSafe(
  value: bigint | string | number | undefined,
  decimals: number
): string {
  if (!value) return '0'
  
  try {
    const bigintValue = typeof value === 'bigint' 
      ? value 
      : BigInt(value.toString())
    
    return formatUnits(bigintValue, decimals)
  } catch {
    return '0'
  }
}

export function parseUnitsSafe(
  value: string | number,
  decimals: number
): bigint {
  try {
    return parseUnits(value.toString(), decimals)
  } catch {
    return 0n
  }
}

export function formatNumber(
  value: string | number,
  options?: {
    decimals?: number
    compact?: boolean
  }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num)) return '0'
  
  if (options?.compact && num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  } else if (options?.compact && num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`
  }
  
  const decimals = options?.decimals ?? 2
  return num.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  })
}

export function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatCoreBalance(
  value: bigint | number | undefined,
  weiDecimals: number
): string {
  if (value === undefined) return '0'

  const bigintValue = typeof value === 'bigint' ? value : BigInt(value)
  
  // CORRECTION: Ne pas faire de conversion ici car la valeur est déjà normalisée
  // par adjustByDecimals() dans useDashboardData.ts
  // La valeur reçue est déjà en weiDecimals
  const formatted = formatUnitsSafe(bigintValue, weiDecimals)
  return formatNumber(formatted, { decimals: 6 })
}
