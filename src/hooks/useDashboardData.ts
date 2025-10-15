import { useAccount, useReadContracts } from 'wagmi'
import { useVaultConfig } from './useVaultConfig'
import { erc20Contract } from '@/contracts/erc20'
import { vaultContract } from '@/contracts/vault'
import { l1readContract } from '@/contracts/l1read'
import { formatUnitsSafe, formatCoreBalance } from '@/lib/format'

export function useDashboardData() {
  const { address } = useAccount()
  const { config, isConfigured } = useVaultConfig()

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
  ] : []

  const { data, isLoading, isError, error } = useReadContracts({
    contracts,
    enabled: isConfigured && !!address,
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
        balance: formatCoreBalance((data[5]?.result as any)?.total || 0n),
        raw: (data[5]?.result as any)?.total || 0n,
      },
      hype: {
        tokenId: config?.coreTokenIds.hype || 0,
        balance: formatCoreBalance((data[6]?.result as any)?.total || 0n),
        raw: (data[6]?.result as any)?.total || 0n,
      },
      btc: {
        tokenId: config?.coreTokenIds.btc || 0,
        balance: formatCoreBalance((data[7]?.result as any)?.total || 0n),
        raw: (data[7]?.result as any)?.total || 0n,
      },
    },
  } : null

  return {
    data: formattedData,
    isLoading,
    isError,
    error,
    isConfigured,
    address,
    config,
  }
}