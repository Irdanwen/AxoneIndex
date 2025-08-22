'use client'

import { Vault } from '@/lib/vaultTypes'
import { VaultCard } from './VaultCard'
import styles from './VaultTable.module.css'

interface VaultTableProps {
  vaults: Vault[]
}

export function VaultTable({ vaults }: VaultTableProps) {
  return (
    <div className={styles.vaultGrid}>
      {vaults.map((vault) => (
        <VaultCard key={vault.id} vault={vault} />
      ))}
    </div>
  )
}
