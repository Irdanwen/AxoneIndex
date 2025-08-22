'use client'

import { Vault } from '@/lib/vaultTypes'
import { VaultCard } from './VaultCard'

interface VaultTableProps {
  vaults: Vault[]
}

export function VaultTable({ vaults }: VaultTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vaults.map((vault) => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  )
}
