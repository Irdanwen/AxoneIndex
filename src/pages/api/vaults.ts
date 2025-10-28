import type { NextApiRequest, NextApiResponse } from 'next'
import { getDefaultConfig } from '@/lib/vaultConfig'

// Simple placeholder API to serve vault list from config
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  const cfg = getDefaultConfig()
  // For now, expose a single vault derived from config to remove MOCK_VAULTS/localStorage
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
      status: 'open',
      risk: 'medium',
      contractAddress: cfg.vaultAddress || '0x',
      usdcAddress: cfg.usdcAddress || '0x'
    }
  ]
  res.status(200).json(vaults)
}


