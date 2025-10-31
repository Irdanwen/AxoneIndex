import type { NextApiRequest, NextApiResponse } from 'next'
import { getConfigForApi } from '@/lib/vaultConfig'
import { fetchVaultData } from '@/lib/vaultData'

/**
 * API pour récupérer la liste des vaults pour le market avec leurs données blockchain
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // Récupérer la configuration pour l'API (adresses depuis env ou défauts)
    const cfg = getConfigForApi()
    
    // Récupérer les données réelles du vault depuis la blockchain
    const vaultData = await fetchVaultData(cfg.vaultAddress, cfg.handlerAddress)
    
    // Si pas de données disponibles, retourner des valeurs par défaut
    if (!vaultData) {
      const vaults = [
        {
          id: 'axone-strategy-1',
          name: 'Axone Strategy 1',
          tvl: 0,
          tokens: [
            { symbol: 'HYPE', percentage: 100 }
          ],
          userDeposit: 0,
          performance30d: 0,
          status: 'open' as const,
          risk: 'medium' as const,
          contractAddress: cfg.vaultAddress || '0x',
          usdcAddress: cfg.usdcAddress || '0x'
        }
      ]
      res.status(200).json(vaults)
      return
    }
    
    // Construire l'objet vault avec les vraies données
    const vaults = [
      {
        id: 'axone-strategy-1',
        name: 'Axone Strategy 1',
        tvl: vaultData.tvl,
        tokens: [
          { symbol: 'HYPE', percentage: 100 }
        ],
        userDeposit: 0, // Pas de wallet connecté côté serveur
        performance30d: 0, // Statique pour l'instant
        status: 'open' as const,
        risk: 'medium' as const,
        contractAddress: cfg.vaultAddress || '0x',
        usdcAddress: cfg.usdcAddress || '0x'
      }
    ]
    
    res.status(200).json(vaults)
  } catch (error) {
    console.error('Error in /api/market:', error)
    res.status(500).json({ error: 'Failed to fetch vault data' })
  }
}





