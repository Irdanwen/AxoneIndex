import { useState, useEffect, useCallback } from 'react'
import type { VaultDefinition } from '@/types/vaults'
import type { VaultUiConfig } from '@/lib/vaultConfig'

export function useVaultConfig() {
  const [config, setConfig] = useState<VaultUiConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Bridge: charger la première config depuis la nouvelle source /api/vaults
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vaults', { cache: 'no-store' })
        const list = (await res.json()) as VaultDefinition[]
        const first = list?.[0]
        if (first && !cancelled) {
          setConfig({
            chainId: first.chainId,
            usdcAddress: first.usdcAddress,
            vaultAddress: first.vaultAddress,
            handlerAddress: first.handlerAddress,
            l1ReadAddress: first.l1ReadAddress,
            coreTokenIds: { ...first.coreTokenIds },
          })
          setError(null)
        } else if (!cancelled) {
          setConfig(null)
        }
      } catch (err) {
        if (!cancelled) setError('Erreur lors du chargement de la configuration')
        console.error(err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Sauvegarder la configuration
  const updateConfig = useCallback((newConfig: VaultUiConfig) => {
    // Déprécié: la configuration se gère désormais côté serveur (/admin/addVault).
    // On met néanmoins à jour l'état local pour compatibilité UI.
    setConfig(newConfig)
    setError(null)
    return true
  }, [])

  // Réinitialiser la configuration
  const resetConfig = useCallback(() => {
    setConfig(null)
    setError(null)
  }, [])

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig,
    isConfigured: !!config
  }
}