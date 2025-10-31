'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import GlassCard from '@/components/ui/GlassCard'
import { Button } from '@/components/ui'
import { VaultForm } from '@/components/vaults/VaultForm'
import type { Vault } from '@/lib/vaultTypes'
import {
  CUSTOM_VAULTS_STORAGE_KEY,
  deleteCustomVault,
  loadCustomVaults,
  saveCustomVaults,
  upsertCustomVault
} from '@/lib/customVaultStorage'

export default function ManageMarketVaultsPage() {
  const [customVaults, setCustomVaults] = useState<Vault[]>([])
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setCustomVaults(loadCustomVaults())

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CUSTOM_VAULTS_STORAGE_KEY) {
        setCustomVaults(loadCustomVaults())
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (!statusMessage) return

    const timeout = window.setTimeout(() => setStatusMessage(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [statusMessage])

  const selectedVault = useMemo(
    () => (selectedVaultId ? customVaults.find(vault => vault.id === selectedVaultId) : undefined),
    [customVaults, selectedVaultId]
  )

  const handleSave = (vault: Vault) => {
    const trimmedId = vault.id.trim()
    if (!trimmedId) return

    const updatedVaults = upsertCustomVault({ ...vault, id: trimmedId })
    setCustomVaults(updatedVaults)
    setSelectedVaultId(trimmedId)
    setStatusMessage('Vault enregistré avec succès. Il apparaîtra dans le market.')
  }

  const handleDelete = () => {
    if (!selectedVaultId) return

    const updated = deleteCustomVault(selectedVaultId)
    setCustomVaults(updated)
    setSelectedVaultId(null)
    setStatusMessage('Vault supprimé de votre configuration locale.')
  }

  const handleCancel = () => {
    setSelectedVaultId(null)
  }

  const handleReset = () => {
    const updated = saveCustomVaults([])
    setCustomVaults(updated)
    setSelectedVaultId(null)
    setStatusMessage('Tous les vaults personnalisés ont été réinitialisés.')
  }

  return (
    <main className="min-h-screen bg-axone-dark">
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-10">
          <header className="space-y-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/market" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Retour au market
              </Link>
            </Button>
            <div>
              <span className="text-sm font-medium uppercase tracking-wide text-vault-muted mb-1 block">Paramétrage</span>
              <h1 className="text-4xl font-semibold text-vault-primary mb-2">Gérer mes vaults</h1>
              <p className="text-base text-vault-muted max-w-2xl">
                Créez et ajustez vos vaults personnalisés. Ils seront enregistrés uniquement dans votre navigateur et seront fusionnés
                avec les données officielles sur la page market.
              </p>
            </div>
            {statusMessage && (
              <GlassCard className="p-4 text-sm text-vault-muted border border-axone-accent/40">
                {statusMessage}
              </GlassCard>
            )}
          </header>

          <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-vault-primary">Vaults enregistrés</h2>
                    <p className="text-sm text-vault-muted">Sélectionnez un vault pour le modifier.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedVaultId(null)}>
                    <Plus className="h-4 w-4" />
                    Nouveau
                  </Button>
                </div>

                <div className="space-y-2">
                  {customVaults.length === 0 ? (
                    <p className="text-sm text-vault-dim">
                      Aucun vault personnalisé pour le moment. Cliquez sur « Nouveau » pour en créer un.
                    </p>
                  ) : (
                    customVaults.map(vault => (
                      <button
                        key={vault.id}
                        onClick={() => setSelectedVaultId(vault.id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                          selectedVaultId === vault.id
                            ? 'border-axone-accent bg-axone-accent/10 text-white'
                            : 'border-white/10 text-vault-muted hover:border-axone-accent/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{vault.name}</span>
                          <span className="text-xs uppercase tracking-wide text-vault-dim">{vault.status}</span>
                        </div>
                        <p className="mt-1 text-xs text-vault-dim">ID: {vault.id}</p>
                      </button>
                    ))
                  )}
                </div>

                {customVaults.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-6 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                    onClick={handleReset}
                  >
                    <Trash2 className="h-4 w-4" />
                    Réinitialiser mes vaults
                  </Button>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="text-lg font-semibold text-vault-primary mb-2">Comment ça marche ?</h2>
                <p className="text-sm text-vault-muted">
                  Les vaults créés ici sont stockés dans le <span className="font-semibold">localStorage</span> de votre navigateur.
                  Ils ne sont visibles que par vous mais enrichissent l&apos;expérience du market en s&apos;ajoutant aux données officielles.
                </p>
              </GlassCard>
            </aside>

            <section className="space-y-6">
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-vault-primary">
                    {selectedVault ? `Modifier ${selectedVault.name}` : 'Créer un nouveau vault'}
                  </h2>
                  <p className="text-sm text-vault-muted">
                    Complétez le formulaire ci-dessous. Le pourcentage total des tokens doit atteindre 100%.
                  </p>
                </div>

                <VaultForm
                  initialData={selectedVault}
                  onSave={handleSave}
                  onCancel={selectedVault ? handleCancel : undefined}
                  onDelete={selectedVault ? handleDelete : undefined}
                />
              </GlassCard>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}
