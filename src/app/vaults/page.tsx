'use client'

import { useState, useEffect } from 'react'
import { VaultTable } from '@/components/vaults/VaultTable'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>([])
  
  // Calcul des métriques utilisateur
  const totalDeposited = vaults.reduce((sum, v) => sum + v.userDeposit, 0)
  const activeVaults = vaults.filter(v => v.userDeposit > 0).length
  const globalYield = vaults
    .filter(v => v.userDeposit > 0)
    .reduce((sum, v) => sum + v.performance30d, 0) / (activeVaults || 1)

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
        
        {/* Section résumé utilisateur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">💵</span>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Déposé</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${totalDeposited.toLocaleString()} USDC
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rendement global</div>
                <div className={`text-xl font-bold ${globalYield >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {globalYield >= 0 ? '+' : ''}{globalYield.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📂</span>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Vaults actifs</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeVaults}
                </div>
              </div>
            </div>
          </div>
        </div>

        <VaultFilters 
          vaults={vaults} 
          onFilter={setFilteredVaults} 
        />
      </div>
      <VaultTable vaults={filteredVaults} />
    </div>
  )
}
