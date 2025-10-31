'use client'

import { useEffect, useMemo, useState } from 'react'

import Footer from '@/components/layout/Footer'
import { VaultDashboard } from '@/components/vaults/VaultDashboard'
import { VaultCardSummary } from '@/components/vaults/VaultCard'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { Vault } from '@/lib/vaultTypes'
import { Loader2 } from 'lucide-react'
import { useChainId } from 'wagmi'
import GlassCard from '@/components/ui/GlassCard'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { loadCustomVaults, CUSTOM_VAULTS_STORAGE_KEY } from '@/lib/customVaultStorage'

export default function MarketPage() {
  const chainId = useChainId()
  const [baseVaults, setBaseVaults] = useState<Vault[]>([])
  const [customVaults, setCustomVaults] = useState<Vault[]>([])
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const allVaults = useMemo(() => [...baseVaults, ...customVaults], [baseVaults, customVaults])

  const totalDeposited = allVaults.reduce((sum, vault) => sum + vault.userDeposit, 0)
  const activeVaults = allVaults.filter(vault => vault.userDeposit > 0).length
  const globalYield = activeVaults > 0
    ? allVaults
        .filter(vault => vault.userDeposit > 0)
        .reduce((sum, vault) => sum + vault.performance30d, 0) / activeVaults
    : 0

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/market')
        const data: Vault[] = await res.json()
        if (!cancelled) {
          setBaseVaults(data)
        }
      } catch {
        // silent fallback
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLocalVaults = () => setCustomVaults(loadCustomVaults())

    loadLocalVaults()

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CUSTOM_VAULTS_STORAGE_KEY) {
        loadLocalVaults()
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    setFilteredVaults(allVaults)
  }, [allVaults])

  const handleInfo = (_vaultId: string) => {
    // Informations détaillées du vault disponibles via la page dédiée
  }

  return (
    <main className="min-h-screen bg-axone-dark">
      <section className="market-shell mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-10">
          <header>
            {chainId !== 998 && (
              <div className="mt-4">
                <GlassCard className="p-4">
                  <p className="text-sm text-white-80">
                    Vous n’êtes pas connecté au réseau HyperEVM Testnet (998). Veuillez changer de réseau pour interagir avec le market des vaults.
                  </p>
                </GlassCard>
              </div>
            )}
            <span className="text-sm font-medium uppercase tracking-wide text-vault-muted mb-1 block">
              Gestion des stratégies
            </span>
            <h1 className="text-4xl font-semibold text-vault-primary mb-2">
              Marché des vaults
            </h1>
            <p className="text-base text-vault-muted">
              Explorez et gérez vos opportunités d&apos;investissement en quelques clics.
            </p>
            <div className="mt-6">
              <Button asChild size="sm" variant="secondary">
                <Link href="/market/manage">Configurer mes vaults</Link>
              </Button>
            </div>
          </header>

          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <aside>
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-vault-primary">Filtres</h2>
                  <p className="text-sm text-vault-muted">
                    Affinez votre sélection selon vos critères.
                  </p>
                </div>
                <VaultFilters vaults={allVaults} onFilter={setFilteredVaults} />
              </GlassCard>
            </aside>

            <article className="flex flex-col gap-8">
              <VaultDashboard
                totalDeposited={totalDeposited}
                globalYield={globalYield}
                activeVaults={activeVaults}
                totalVaults={allVaults.length}
                variant="dense"
              />

              {isLoading ? (
                <GlassCard className="py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white-60 inline-block" />
                </GlassCard>
              ) : filteredVaults.length === 0 ? (
                <GlassCard className="p-10 text-center">
                  <p className="text-base font-medium text-vault-muted">
                    Aucun vault ne correspond à vos critères.
                  </p>
                  <p className="mt-2 text-sm text-vault-dim">
                    Ajustez vos filtres pour explorer d&apos;autres opportunités.
                  </p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredVaults.map(vault => (
                    <VaultCardSummary
                      key={vault.id}
                      vault={vault}
                      onInfo={() => handleInfo(vault.id)}
                    />
                  ))}
                </div>
              )}

              {!isLoading && filteredVaults.length > 0 && (
                <p className="text-sm text-vault-dim">
                  {filteredVaults.length} vault{filteredVaults.length > 1 ? 's' : ''} affiché{filteredVaults.length > 1 ? 's' : ''}
                  {filteredVaults.length !== allVaults.length && ` sur ${allVaults.length}`}
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
