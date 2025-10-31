'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

import GlassCard from '@/components/ui/GlassCard'
import { Button } from '@/components/ui'
import { VaultForm } from '@/components/vaults/VaultForm'
import type { Vault } from '@/lib/vaultTypes'
import {
  deleteCustomVault as deleteCustomVaultFromService,
  listCustomVaults,
  saveCustomVault as saveCustomVaultToService
} from '@/lib/customVaultService'

export default function ManageMarketVaultsPage() {
  const [customVaults, setCustomVaults] = useState<Vault[]>([])
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchVaults = async () => {
      setIsLoading(true)
      try {
        const vaults = await listCustomVaults()
        if (!cancelled) {
          setCustomVaults(vaults)
          setErrorMessage(null)
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(null)
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Impossible de charger les vaults personnalisés."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchVaults()

    return () => {
      cancelled = true
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

  const handleSave = async (vault: Vault) => {
    const trimmedId = vault.id.trim()
    if (!trimmedId) return

    try {
      const updatedVaults = await saveCustomVaultToService({ ...vault, id: trimmedId })
      setCustomVaults(updatedVaults)
      setSelectedVaultId(trimmedId)
      setStatusMessage('Vault enregistré avec succès. Il est désormais visible sur le market partagé.')
      setErrorMessage(null)
    } catch (error) {
      setStatusMessage(null)
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible d'enregistrer ce vault pour le moment."
      )
    }
  }

  const handleDelete = async () => {
    if (!selectedVaultId) return

    try {
      const updated = await deleteCustomVaultFromService(selectedVaultId)
      setCustomVaults(updated)
      setSelectedVaultId(null)
      setStatusMessage('Vault supprimé. La liste partagée a été mise à jour.')
      setErrorMessage(null)
    } catch (error) {
      setStatusMessage(null)
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de supprimer ce vault pour le moment."
      )
    }
  }

  const handleCancel = () => {
    setSelectedVaultId(null)
  }

  const handleReset = async () => {
    try {
      const updated = await deleteCustomVaultFromService()
      setCustomVaults(updated)
      setSelectedVaultId(null)
      setStatusMessage('Tous les vaults personnalisés ont été supprimés de l’espace partagé.')
      setErrorMessage(null)
    } catch (error) {
      setStatusMessage(null)
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de réinitialiser les vaults pour le moment."
      )
    }
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
                Créez et ajustez vos vaults personnalisés. Ils sont sauvegardés dans un stockage partagé et s’ajoutent aux données
                officielles visibles sur la page market.
              </p>
            </div>
            {(statusMessage || errorMessage) && (
              <GlassCard
                className={`p-4 text-sm border ${
                  errorMessage
                    ? 'border-red-400/60 text-red-200'
                    : 'border-axone-accent/40 text-vault-muted'
                }`}
              >
                {errorMessage ?? statusMessage}
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
                  {isLoading ? (
                    <p className="text-sm text-vault-dim">Chargement des vaults personnalisés…</p>
                  ) : customVaults.length === 0 ? (
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

                {customVaults.length > 0 && !isLoading && (
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
                  Les vaults créés ici sont enregistrés dans un espace partagé du dashboard. Toute modification est immédiatement
                  prise en compte sur la page market et visible par l’ensemble des visiteurs.
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
