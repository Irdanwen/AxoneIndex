'use client'

import { useState, useEffect } from 'react'
import { VaultTable } from '@/components/vaults/VaultTable'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('vaults')
    const data = saved ? JSON.parse(saved) : MOCK_VAULTS
    setVaults(data)
    setFilteredVaults(data)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8 bg-white dark:bg-axone-stellar-green min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-axone-stellar-green dark:text-white mb-2">
          Vaults disponibles
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gérez vos positions et découvrez de nouvelles opportunités
        </p>
        <VaultFilters 
          vaults={vaults} 
          onFilter={setFilteredVaults} 
        />
      </div>
      <VaultTable vaults={filteredVaults} />
    </div>
  )
}
