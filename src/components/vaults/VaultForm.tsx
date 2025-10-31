'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Vault, VaultToken } from '@/lib/vaultTypes'

interface VaultFormProps {
  initialData?: Vault
  onSave: (vault: Vault) => void
  onDelete?: () => void
  onCancel?: () => void
  autoSave?: boolean
}

const createEmptyVault = (): Vault => ({
  id: '',
  name: '',
  tvl: 0,
  tokens: [],
  userDeposit: 0,
  performance30d: 0,
  status: 'open',
  risk: 'low',
  contractAddress: '',
  usdcAddress: ''
})

export function VaultForm({ initialData, onSave, onDelete, onCancel, autoSave }: VaultFormProps) {
  const [formData, setFormData] = useState<Vault>(initialData ? { ...initialData } : createEmptyVault())

  const isFirstRenderRef = useRef(true)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFormData(initialData ? { ...initialData } : createEmptyVault())
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const totalPercentage = formData.tokens.reduce((sum, token) => sum + token.percentage, 0)

  // Auto-enregistrement (debounce) lorsqu'activé
  useEffect(() => {
    if (!autoSave) return
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = setTimeout(() => {
      const hasTokens = formData.tokens.length > 0
      const isValidTotal = totalPercentage === 100
      if (!hasTokens || isValidTotal) {
        onSave(formData)
      }
    }, 500)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [autoSave, formData, onSave, totalPercentage])

  const addToken = () => {
    setFormData({
      ...formData,
      tokens: [...formData.tokens, { symbol: '', percentage: 0 }]
    })
  }

  const removeToken = (index: number) => {
    setFormData({
      ...formData,
      tokens: formData.tokens.filter((_, i) => i !== index)
    })
  }

  const updateToken = (index: number, field: keyof VaultToken, value: string | number) => {
    const newTokens = [...formData.tokens]
    newTokens[index] = { ...newTokens[index], [field]: value }
    setFormData({ ...formData, tokens: newTokens })
  }

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-white dark:bg-gray-800">
      <div className="mb-6">
        <Label>Identifiant du Vault</Label>
        <Input
          value={formData.id}
          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
          required
          placeholder="axone-strategy-1"
          className="dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Utilisé pour identifier le vault de manière unique sur le market.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Nom du Vault</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <Label>TVL (USDC)</Label>
            <Input
              type="number"
              value={formData.tvl}
              onChange={(e) => setFormData({ ...formData, tvl: Number(e.target.value) })}
              required
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <Label>Statut</Label>
            <Select 
              value={formData.status} 
              onValueChange={(v: 'open' | 'closed' | 'paused') => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="dark:bg-gray-700">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Niveau de risque</Label>
            <Select 
              value={formData.risk} 
              onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, risk: v })}
            >
              <SelectTrigger className="dark:bg-gray-700">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Bas</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Performance 30j (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={formData.performance30d}
              onChange={(e) => setFormData({ ...formData, performance30d: Number(e.target.value) })}
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label>Dépôt utilisateur (USDC)</Label>
            <Input
              type="number"
              value={formData.userDeposit}
              onChange={(e) => setFormData({ ...formData, userDeposit: Number(e.target.value) })}
              className="dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>Adresse du contrat Vault</Label>
          <Input
            placeholder="0x..."
            value={formData.contractAddress || ''}
            onChange={(e) => setFormData({ ...formData, contractAddress: e.target.value })}
            className="dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <Label>Adresse du token USDC</Label>
          <Input
            placeholder="0x..."
            value={formData.usdcAddress || ''}
            onChange={(e) => setFormData({ ...formData, usdcAddress: e.target.value })}
            className="dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <Label>Composition des tokens</Label>
          <Button type="button" variant="outline" size="sm" onClick={addToken}>
            + Ajouter
          </Button>
        </div>
        
        <div className="space-y-2">
          {formData.tokens.map((token, index) => (
            <div key={index} className="flex space-x-2 items-center">
              <Input
                placeholder="Symbole"
                value={token.symbol}
                onChange={(e) => updateToken(index, 'symbol', e.target.value)}
                className="w-24 dark:bg-gray-700 dark:text-white"
              />
              <Input
                type="number"
                placeholder="%"
                value={token.percentage}
                onChange={(e) => updateToken(index, 'percentage', Number(e.target.value))}
                className="w-20 dark:bg-gray-700 dark:text-white"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => removeToken(index)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
        
        {formData.tokens.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Total: {totalPercentage}% {totalPercentage !== 100 && '(doit être 100%)'}
          </div>
        )}
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Supprimer
          </Button>
        )}
        <Button type="submit" disabled={totalPercentage !== 100 && formData.tokens.length > 0}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
