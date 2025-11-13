import { getPublicClient } from './serverBlockchain'
import { vaultContractAbiExtended } from './abi/VaultContract'
import { formatUnits, type Address } from 'viem'

export interface VaultData {
  totalSupply: string
  pps: string
  tvl: number
  decimals: number
}

/**
 * Récupère les données publiques du vault depuis la blockchain
 * @param vaultAddress - Adresse du contrat vault
 * @param handlerAddress - Adresse du contrat handler (pour le prix oracle)
 * @returns Données du vault ou null en cas d'erreur
 */
export async function fetchVaultData(
  vaultAddress: string | undefined,
  handlerAddress: string | undefined
): Promise<VaultData | null> {
  if (!vaultAddress || !handlerAddress) {
    return null
  }

  try {
    const client = getPublicClient()
    
    // Lire les données du vault en parallèle
    const [totalSupply, pps1e18, decimals] = await Promise.all([
      // totalSupply du vault (shares)
      client.readContract({
        address: vaultAddress as Address,
        abi: vaultContractAbiExtended,
        functionName: 'totalSupply',
      }),
      // PPS (price per share) en USD 1e18
      client.readContract({
        address: vaultAddress as Address,
        abi: vaultContractAbiExtended,
        functionName: 'pps1e18',
      }),
      // Decimals du vault
      client.readContract({
        address: vaultAddress as Address,
        abi: vaultContractAbiExtended,
        functionName: 'decimals',
      }),
    ])

    // Convertir en strings formatées
    const totalSupplyStr = formatUnits(totalSupply as bigint, Number(decimals))
    const ppsStr = formatUnits(pps1e18 as bigint, 18)
    const vaultDecimals = Number(decimals)

    // Calculer le TVL en USD: (totalSupply * pps) / 1e18
    const tvlBigInt = (pps1e18 as bigint * (totalSupply as bigint)) / BigInt(10 ** vaultDecimals)
    const tvl = Number(formatUnits(tvlBigInt, 18))

    return {
      totalSupply: totalSupplyStr,
      pps: ppsStr,
      tvl,
      decimals: vaultDecimals,
    }
  } catch (error) {
    console.error('Error fetching vault data:', error)
    return null
  }
}

