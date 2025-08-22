'use client'

import { useState, useEffect } from 'react'
import { VaultTable } from '@/components/vaults/VaultTable'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import GlassCard from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'

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
    <main className="min-h-screen bg-axone-dark">
      <Header />
      
      {/* Section avec fond en dégradé animé */}
      <section className="hero-gradient min-h-screen relative overflow-hidden">
        {/* Particules de fond animées */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-2 h-2 bg-axone-accent rounded-full opacity-60"
            style={{ top: '20%', left: '10%' }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute w-3 h-3 bg-axone-flounce rounded-full opacity-40"
            style={{ top: '60%', right: '15%' }}
            animate={{
              y: [0, 15, 0],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div
            className="absolute w-1 h-1 bg-white-pure rounded-full opacity-80"
            style={{ top: '40%', left: '80%' }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        <div className="container-custom section-padding pt-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="hero-title text-gradient mb-4">
              Vaults disponibles
            </h1>
            <p className="hero-subtitle text-white-85 mb-8">
              Gérez vos positions et découvrez de nouvelles opportunités
            </p>
            
            {/* Section résumé utilisateur avec GlassCard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <GlassCard className="p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">💵</span>
                  <div>
                    <div className="text-sm text-white-60">Total Déposé</div>
                    <div className="text-xl font-bold text-white-pure">
                      ${totalDeposited.toLocaleString()} USDC
                    </div>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📊</span>
                  <div>
                    <div className="text-sm text-white-60">Rendement global</div>
                    <div className={`text-xl font-bold ${globalYield >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {globalYield >= 0 ? '+' : ''}{globalYield.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </GlassCard>
              
              <GlassCard className="p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📂</span>
                  <div>
                    <div className="text-sm text-white-60">Vaults actifs</div>
                    <div className="text-xl font-bold text-white-pure">
                      {activeVaults}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <VaultFilters 
                vaults={vaults} 
                onFilter={setFilteredVaults} 
              />
            </motion.div>
          </motion.div>
          
          {/* Table des vaults avec animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full"
          >
            <VaultTable vaults={filteredVaults} />
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
