'use client'

import { useState, useEffect } from 'react'
import { isAddress } from 'viem'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { getDefaultConfig, type VaultUiConfig } from '@/lib/vaultConfig'
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { AlertCircle, CheckCircle2, Save, RefreshCw } from 'lucide-react'

export default function AdminVaultsPage() {
  const { config, updateConfig, resetConfig, isConfigured } = useVaultConfig()
  const [formData, setFormData] = useState<VaultUiConfig>({
    chainId: 998,
    usdcAddress: '0x',
    vaultAddress: '0x',
    handlerAddress: '0x',
    l1ReadAddress: '0x',
    coreTokenIds: {
      usdc: 0,
      hype: 0,
      btc: 0,
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  // Charger la configuration existante ou les valeurs par défaut
  useEffect(() => {
    if (config) {
      setFormData(config)
    } else {
      const defaults = getDefaultConfig()
      setFormData({
        chainId: defaults.chainId || 998,
        usdcAddress: defaults.usdcAddress || '0x',
        vaultAddress: '0x',
        handlerAddress: '0x',
        l1ReadAddress: '0x',
        coreTokenIds: {
          usdc: 0,
          hype: 0,
          btc: 0,
        },
      })
    }
  }, [config])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!isAddress(formData.usdcAddress)) {
      newErrors.usdcAddress = 'Adresse USDC invalide'
    }
    if (!isAddress(formData.vaultAddress)) {
      newErrors.vaultAddress = 'Adresse Vault invalide'
    }
    if (!isAddress(formData.handlerAddress)) {
      newErrors.handlerAddress = 'Adresse Handler invalide'
    }
    if (!isAddress(formData.l1ReadAddress)) {
      newErrors.l1ReadAddress = 'Adresse L1Read invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    if (validateForm()) {
      const success = updateConfig(formData)
      if (success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    }
  }

  const handleReset = () => {
    resetConfig()
    const defaults = getDefaultConfig()
    setFormData({
      chainId: defaults.chainId || 998,
      usdcAddress: defaults.usdcAddress || '0x',
      vaultAddress: '0x',
      handlerAddress: '0x',
      l1ReadAddress: '0x',
      coreTokenIds: {
        usdc: 0,
        hype: 0,
        btc: 0,
      },
    })
    setErrors({})
    setSuccess(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Configuration des Vaults</CardTitle>
          <CardDescription>
            Configurez les adresses des contrats et les IDs des tokens Core
          </CardDescription>
          <div className="flex items-center gap-2 mt-4">
            {isConfigured ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm">Configuration valide</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Configuration manquante ou invalide</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Adresses des contrats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Adresses des contrats</h3>
              
              <div className="space-y-2">
                <Label htmlFor="usdcAddress">Adresse USDC</Label>
                <Input
                  id="usdcAddress"
                  value={formData.usdcAddress}
                  onChange={(e) => setFormData({ ...formData, usdcAddress: e.target.value as `0x${string}` })}
                  placeholder="0x..."
                  className={errors.usdcAddress ? 'border-red-500' : ''}
                />
                {errors.usdcAddress && (
                  <p className="text-sm text-red-500">{errors.usdcAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vaultAddress">Adresse Vault</Label>
                <Input
                  id="vaultAddress"
                  value={formData.vaultAddress}
                  onChange={(e) => setFormData({ ...formData, vaultAddress: e.target.value as `0x${string}` })}
                  placeholder="0x..."
                  className={errors.vaultAddress ? 'border-red-500' : ''}
                />
                {errors.vaultAddress && (
                  <p className="text-sm text-red-500">{errors.vaultAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="handlerAddress">Adresse CoreInteractionHandler</Label>
                <Input
                  id="handlerAddress"
                  value={formData.handlerAddress}
                  onChange={(e) => setFormData({ ...formData, handlerAddress: e.target.value as `0x${string}` })}
                  placeholder="0x..."
                  className={errors.handlerAddress ? 'border-red-500' : ''}
                />
                {errors.handlerAddress && (
                  <p className="text-sm text-red-500">{errors.handlerAddress}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l1ReadAddress">Adresse L1Read</Label>
                <Input
                  id="l1ReadAddress"
                  value={formData.l1ReadAddress}
                  onChange={(e) => setFormData({ ...formData, l1ReadAddress: e.target.value as `0x${string}` })}
                  placeholder="0x..."
                  className={errors.l1ReadAddress ? 'border-red-500' : ''}
                />
                {errors.l1ReadAddress && (
                  <p className="text-sm text-red-500">{errors.l1ReadAddress}</p>
                )}
              </div>
            </div>

            {/* Token IDs Core */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Token IDs Core</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usdcTokenId">USDC Token ID</Label>
                  <Input
                    id="usdcTokenId"
                    type="number"
                    value={formData.coreTokenIds.usdc}
                    onChange={(e) => setFormData({
                      ...formData,
                      coreTokenIds: { ...formData.coreTokenIds, usdc: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hypeTokenId">HYPE Token ID</Label>
                  <Input
                    id="hypeTokenId"
                    type="number"
                    value={formData.coreTokenIds.hype}
                    onChange={(e) => setFormData({
                      ...formData,
                      coreTokenIds: { ...formData.coreTokenIds, hype: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="btcTokenId">BTC Token ID</Label>
                  <Input
                    id="btcTokenId"
                    type="number"
                    value={formData.coreTokenIds.btc}
                    onChange={(e) => setFormData({
                      ...formData,
                      coreTokenIds: { ...formData.coreTokenIds, btc: parseInt(e.target.value) || 0 }
                    })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span>Configuration enregistrée avec succès !</span>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}