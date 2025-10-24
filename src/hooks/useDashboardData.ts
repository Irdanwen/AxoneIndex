import { useAccount, useReadContracts, useBalance } from 'wagmi'
import { useVaultConfig } from './useVaultConfig'
import { erc20Contract } from '@/contracts/erc20'
import { vaultContract } from '@/contracts/vault'
import { l1readContract } from '@/contracts/l1read'
import { coreInteractionHandlerContract } from '@/contracts/coreInteractionHandler'
import { formatUnitsSafe, formatCoreBalance } from '@/lib/format'

// Mapping des décimales des prix oracle par actif
// Les fonctions smart contract oraclePxHype1e8() et oraclePxBtc1e8() normalisent déjà les prix vers 1e8
// BTC : conversion de 1e3 → 1e8 (multiplie par 100000)
// HYPE : conversion de 1e6 → 1e8 (multiplie par 100)
const PX_DECIMALS = {
  btc: 8,   // BTC prix normalisé en 1e8 (ex: 4500000000 = 45000 USD)
  hype: 8,  // HYPE prix normalisé en 1e8 (ex: 500000000 = 50 USD)
} as const

type SpotBalanceResult = {
  total: bigint
  hold: bigint
  entryNtl: bigint
}

type TokenInfoResult = {
  name: string
  spots: bigint[]
  deployerTradingFeeShare: bigint
  deployer: `0x${string}`
  evmContract: `0x${string}`
  szDecimals: number
  weiDecimals: number
  evmExtraWeiDecimals: number
}

type CoreBalanceData = {
  tokenId: number
  balance: string
  raw: bigint
  normalized: bigint
  decimals: {
    szDecimals: number
    weiDecimals: number
    adjustmentPower: number
    isInferred: boolean
  }
}

export function useDashboardData() {
  const { address } = useAccount()
  const { config, isConfigured } = useVaultConfig()

  // Solde natif HYPE (1e18)
  const { data: hypeNative, isLoading: isLoadingNative } = useBalance({
    address,
    query: { enabled: !!address },
  })

  // Préparer les contrats pour les lectures
  const contracts = config && address ? [
    // USDC balance de l'utilisateur
    {
      ...erc20Contract(config.usdcAddress),
      functionName: 'balanceOf',
      args: [address],
    },
    // USDC decimals
    {
      ...erc20Contract(config.usdcAddress),
      functionName: 'decimals',
    },
    // Vault balance de l'utilisateur
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'balanceOf',
      args: [address],
    },
    // Vault totalSupply
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'totalSupply',
    },
    // Vault decimals
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'decimals',
    },
    // Core USDC balance
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'spotBalance',
      args: [config.handlerAddress, BigInt(config.coreTokenIds.usdc)],
    },
    // Core USDC token info
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'tokenInfo',
      args: [BigInt(config.coreTokenIds.usdc)],
    },
    // Core HYPE balance
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'spotBalance',
      args: [config.handlerAddress, BigInt(config.coreTokenIds.hype)],
    },
    // Core HYPE token info
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'tokenInfo',
      args: [BigInt(config.coreTokenIds.hype)],
    },
    // Core BTC balance
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'spotBalance',
      args: [config.handlerAddress, BigInt(config.coreTokenIds.btc)],
    },
    // Core BTC token info
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'tokenInfo',
      args: [BigInt(config.coreTokenIds.btc)],
    },
    // Handler core equity (USD 1e18)
    {
      ...coreInteractionHandlerContract(config.handlerAddress),
      functionName: 'equitySpotUsd1e18',
    },
    // Oracle BTC (1e8)
    {
      ...coreInteractionHandlerContract(config.handlerAddress),
      functionName: 'oraclePxBtc1e8',
    },
    // Oracle HYPE (1e8)
    {
      ...coreInteractionHandlerContract(config.handlerAddress),
      functionName: 'oraclePxHype1e8',
    },
    // Vault PPS (USD 1e18)
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'pps1e18',
    },
  ] : []

  const { data, isLoading, isError, error } = useReadContracts({
    contracts,
    query: {
      enabled: isConfigured && !!address,
    },
  })

  // Formater les données
  const adjustByDecimals = (value: bigint, weiDecimals: number, szDecimals: number) => {
    const diff = weiDecimals - szDecimals
    if (diff === 0) return value
    if (diff > 0) {
      return value * 10n ** BigInt(diff)
    }

    const divisor = 10n ** BigInt(Math.abs(diff))
    if (divisor === 0n) return value
    return value / divisor
  }

  const buildCoreBalance = (
    tokenId: number | undefined,
    spot: SpotBalanceResult | undefined,
    info: TokenInfoResult | undefined
  ): CoreBalanceData => {
    const total = spot?.total ?? 0n
    const szDecimals = typeof info?.szDecimals === 'number' ? info.szDecimals : undefined
    const weiDecimals = typeof info?.weiDecimals === 'number' ? info.weiDecimals : undefined

    const fallbackWeiDecimals = weiDecimals ?? 8
    const fallbackSzDecimals = szDecimals ?? fallbackWeiDecimals
    const normalized = adjustByDecimals(total, fallbackWeiDecimals, fallbackSzDecimals)

    return {
      tokenId: tokenId ?? 0,
      balance: formatCoreBalance(total, fallbackWeiDecimals, fallbackSzDecimals),
      raw: total,
      normalized,
      decimals: {
        szDecimals: fallbackSzDecimals,
        weiDecimals: fallbackWeiDecimals,
        adjustmentPower: fallbackWeiDecimals - fallbackSzDecimals,
        isInferred: typeof weiDecimals !== 'number' || typeof szDecimals !== 'number',
      },
    }
  }

  const formattedData = data ? {
    usdcBalance: formatUnitsSafe(
      data[0]?.result as bigint,
      ((data[1]?.result as number) ?? 8)
    ),
    usdcDecimals: ((data[1]?.result as number) ?? 8),
    vaultShares: formatUnitsSafe(data[2]?.result as bigint, (data[4]?.result as number) || 18),
    vaultTotalSupply: formatUnitsSafe(data[3]?.result as bigint, (data[4]?.result as number) || 18),
    vaultDecimals: (data[4]?.result as number) || 18,
    coreBalances: {
      usdc: buildCoreBalance(
        config?.coreTokenIds.usdc,
        data[5]?.result as SpotBalanceResult | undefined,
        data[6]?.result as TokenInfoResult | undefined
      ),
      hype: buildCoreBalance(
        config?.coreTokenIds.hype,
        data[7]?.result as SpotBalanceResult | undefined,
        data[8]?.result as TokenInfoResult | undefined
      ),
      btc: buildCoreBalance(
        config?.coreTokenIds.btc,
        data[9]?.result as SpotBalanceResult | undefined,
        data[10]?.result as TokenInfoResult | undefined
      ),
    },
    coreEquityUsd: formatUnitsSafe(data[11]?.result as bigint, 18),
    // CORRECTION: Utiliser les pxDecimals réels Hyperliquid au lieu de 1e8 fixe
    oraclePxBtc: formatUnitsSafe(data[12]?.result as bigint, PX_DECIMALS.btc),
    oraclePxHype: formatUnitsSafe(data[13]?.result as bigint, PX_DECIMALS.hype),
    pps: formatUnitsSafe(data[14]?.result as bigint, 18),
    hypeNativeBalance: formatUnitsSafe(hypeNative?.value as bigint | undefined, hypeNative?.decimals ?? 18),
  } : null

  return {
    data: formattedData,
    isLoading: isLoading || isLoadingNative,
    isError,
    error,
    isConfigured,
    address,
    config,
  }
}