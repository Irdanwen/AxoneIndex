'use client'

import { Vault } from '@/lib/vaultTypes'
import { VaultCard } from './VaultCard'

interface VaultTableProps {
  vaults: Vault[]
}

export function VaultTable({ vaults }: VaultTableProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
      {vaults.map((vault) => (
        <div key={vault.id} className="p-1 sm:p-1.5 lg:p-2 h-full">
          <VaultCard vault={vault} />
        </div>
      ))}
    </div>
  )
}
