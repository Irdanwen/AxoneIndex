'use client'

import { useEffect, useState } from 'react'

import Footer from '@/components/layout/Footer'
import { VaultDashboard } from '@/components/vaults/VaultDashboard'
import { VaultCardSummary } from '@/components/vaults/VaultCard'
import { VaultFilters } from '@/components/vaults/VaultFilters'
import { MOCK_VAULTS } from '@/lib/vaultMock'
import { Vault } from '@/lib/vaultTypes'
import { Loader2 } from 'lucide-react'

export default function VaultsPage() {
  const [vaults, setVaults] = useState<Vault[]>([])
  const [filteredVaults, setFilteredVaults] = useState<Vault[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const totalDeposited = vaults.reduce((sum, vault) => sum + vault.userDeposit, 0)
  const activeVaults = vaults.filter(vault => vault.userDeposit > 0).length
  const globalYield = activeVaults > 0
    ? vaults
        .filter(vault => vault.userDeposit > 0)
        .reduce((sum, vault) => sum + vault.performance30d, 0) / activeVaults
    : 0

  useEffect(() => {
    const timeout = setTimeout(() => {
      const saved = localStorage.getItem('vaults')
      const data = saved ? JSON.parse(saved) : MOCK_VAULTS
      setVaults(data)
      setFilteredVaults(data)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  const handleInfo = (vaultId: string) => {
    console.log('View vault info:', vaultId)
  }

  return (
    <>
      <section className="vaults-shell mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-10">
          <header className="space-y-3">
            <span className="text-sm font-medium uppercase tracking-wide text-vault-muted">
              Gestion des stratégies
            </span>
            <h1 className="text-4xl font-semibold text-vault-primary">
              Vaults disponibles
            </h1>
            <p className="text-base text-vault-muted">
              Explorez et gérez vos opportunités d&apos;investissement en quelques clics.
            </p>
          </header>

          <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <div className="vault-pane-alt p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-vault-primary">Filtres</h2>
                  <p className="text-sm text-vault-muted">
                    Affinez votre sélection selon vos critères.
                  </p>
                </div>
                <VaultFilters vaults={vaults} onFilter={setFilteredVaults} />
              </div>
            </aside>

            <article className="flex flex-col gap-8">
              <VaultDashboard
                totalDeposited={totalDeposited}
                globalYield={globalYield}
                activeVaults={activeVaults}
                totalVaults={vaults.length}
                variant="dense"
              />

              {isLoading ? (
                <div className="flex items-center justify-center rounded-2xl border border-vault bg-vault-muted py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-vault-muted" />
                </div>
              ) : filteredVaults.length === 0 ? (
                <div className="vault-pane-alt p-10 text-center">
                  <p className="text-base font-medium text-vault-muted">
                    Aucun vault ne correspond à vos critères.
                  </p>
                  <p className="mt-2 text-sm text-vault-dim">
                    Ajustez vos filtres pour explorer d&apos;autres opportunités.
                  </p>
                </div>
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
                  {filteredVaults.length !== vaults.length && ` sur ${vaults.length}`}
                </p>
              )}
            </article>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
