'use client'

import { useState, useEffect } from 'react'
import { VaultCard } from '@/components/vaults/VaultCard'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { VaultDashboard } from '@/components/vaults/VaultDashboard'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Calculate user metrics
  const totalDeposited = vaults.reduce((sum, v) => sum + v.userDeposit, 0)
  const activeVaults = vaults.filter(v => v.userDeposit > 0).length
  const globalYield = activeVaults > 0
    ? vaults
        .filter(v => v.userDeposit > 0)
        .reduce((sum, v) => sum + v.performance30d, 0) / activeVaults
    : 0

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const saved = localStorage.getItem('vaults')
      const data = saved ? JSON.parse(saved) : MOCK_VAULTS
      setVaults(data)
      setFilteredVaults(data)
      setIsLoading(false)
    }, 500)
  }, [])

  const handleDeposit = (vaultId: string) => {
    console.log('Deposit to vault:', vaultId)
    // TODO: Implement deposit logic
  }

  const handleWithdraw = (vaultId: string) => {
    console.log('Withdraw from vault:', vaultId)
    // TODO: Implement withdraw logic
  }

  const handleInfo = (vaultId: string) => {
    console.log('View vault info:', vaultId)
    // TODO: Navigate to vault details page
  }

  return (
    <main className="min-h-screen hero-gradient">
      <Header />
      
      <div className="relative">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-vault-brand/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 container-custom py-8" style={{ paddingTop: '10rem' }}>
          {/* Dashboard Header */}
          <VaultDashboard
            totalDeposited={totalDeposited}
            globalYield={globalYield}
            activeVaults={activeVaults}
            totalVaults={vaults.length}
          />

          {/* Page Title and Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-vault-primary mb-2">
              Vaults disponibles
            </h2>
            <p className="text-vault-muted">
              Explorez et gérez vos opportunités d&apos;investissement
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <VaultFilters 
              vaults={vaults} 
              onFilter={setFilteredVaults} 
            />
          </motion.div>

          {/* Vaults Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-vault-brand animate-spin" />
            </div>
          ) : filteredVaults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <p className="text-vault-muted text-lg mb-2">
                Aucun vault ne correspond à vos critères
              </p>
              <p className="text-vault-dim text-sm">
                Essayez de modifier vos filtres pour voir plus de résultats
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6"
              style={{ gap: '1rem' }}
            >
              {filteredVaults.map((vault, index) => (
                <motion.div
                  key={vault.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <VaultCard 
                    vault={vault}
                    onDeposit={() => handleDeposit(vault.id)}
                    onWithdraw={() => handleWithdraw(vault.id)}
                    onInfo={() => handleInfo(vault.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Results count */}
          {!isLoading && filteredVaults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-8 text-center"
            >
              <p className="text-sm text-vault-dim">
                {filteredVaults.length} vault{filteredVaults.length > 1 ? 's' : ''} affiché{filteredVaults.length > 1 ? 's' : ''}
                {filteredVaults.length !== vaults.length && ` sur ${vaults.length}`}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
