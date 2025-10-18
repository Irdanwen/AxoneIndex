import { useAccount, useReadContracts, useBalance } from 'wagmi'
import { useVaultConfig } from './useVaultConfig'
import { erc20Contract } from '@/contracts/erc20'
import { vaultContract } from '@/contracts/vault'
import { l1readContract } from '@/contracts/l1read'
import { coreInteractionHandlerContract } from '@/contracts/coreInteractionHandler'
import { formatUnitsSafe, formatCoreBalance } from '@/lib/format'

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
    // Core HYPE balance
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'spotBalance',
      args: [config.handlerAddress, BigInt(config.coreTokenIds.hype)],
    },
    // Core BTC balance
    {
      ...l1readContract(config.l1ReadAddress),
      functionName: 'spotBalance',
      args: [config.handlerAddress, BigInt(config.coreTokenIds.btc)],
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
  const formattedData = data ? {
    usdcBalance: formatUnitsSafe(data[0]?.result as bigint, 6),
    usdcDecimals: data[1]?.result as number || 6,
    vaultShares: formatUnitsSafe(data[2]?.result as bigint, data[4]?.result as number || 18),
    vaultTotalSupply: formatUnitsSafe(data[3]?.result as bigint, data[4]?.result as number || 18),
    vaultDecimals: data[4]?.result as number || 18,
    coreBalances: {
      usdc: {
        tokenId: config?.coreTokenIds.usdc || 0,
        balance: formatCoreBalance((data[5]?.result as { total: bigint })?.total || 0n),
        raw: (data[5]?.result as { total: bigint })?.total || 0n,
      },
      hype: {
        tokenId: config?.coreTokenIds.hype || 0,
        balance: formatCoreBalance((data[6]?.result as { total: bigint })?.total || 0n),
        raw: (data[6]?.result as { total: bigint })?.total || 0n,
      },
      btc: {
        tokenId: config?.coreTokenIds.btc || 0,
        balance: formatCoreBalance((data[7]?.result as { total: bigint })?.total || 0n),
        raw: (data[7]?.result as { total: bigint })?.total || 0n,
      },
    },
    coreEquityUsd: formatUnitsSafe(data[8]?.result as bigint, 18),
    oraclePxBtc1e8: Number(data[9]?.result as bigint | number | undefined) || 0,
    oraclePxHype1e8: Number(data[10]?.result as bigint | number | undefined) || 0,
    pps: formatUnitsSafe(data[11]?.result as bigint, 18),
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