import { useState, useEffect, useCallback } from 'react'
import { loadConfig, saveConfig, validateConfig, clearConfig, type VaultUiConfig } from '@/lib/vaultConfig'

export function useVaultConfig() {
  const [config, setConfig] = useState<VaultUiConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger la configuration au montage
  useEffect(() => {
    try {
      const loaded = loadConfig()
      setConfig(loaded)
      setError(null)
    } catch (err) {
      setError('Erreur lors du chargement de la configuration')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Sauvegarder la configuration
  const updateConfig = useCallback((newConfig: VaultUiConfig) => {
    try {
      if (!validateConfig(newConfig)) {
        setError('Configuration invalide')
        return false
      }

      const success = saveConfig(newConfig)
      if (success) {
        setConfig(newConfig)
        setError(null)
        return true
      } else {
        setError('Erreur lors de la sauvegarde')
        return false
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour')
      console.error(err)
      return false
    }
  }, [])

  // Réinitialiser la configuration
  const resetConfig = useCallback(() => {
    clearConfig()
    setConfig(null)
    setError(null)
  }, [])

  return {
    config,
    isLoading,
    error,
    updateConfig,
    resetConfig,
    isConfigured: !!config && validateConfig(config)
  }
}