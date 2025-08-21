'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Vault } from '@/lib/vaultTypes'

interface VaultFiltersProps {
  vaults: Vault[]
  onFilter: (vaults: Vault[]) => void
}

export function VaultFilters({ vaults, onFilter }: VaultFiltersProps) {
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [tokens, setTokens] = useState<string[]>([])
  const [status, setStatus] = useState<'all' | 'open' | 'closed' | 'paused'>('all')
  const [showUserVaults, setShowUserVaults] = useState(false)

  const applyFilters = () => {
    let filtered = [...vaults]

    // Tri par TVL
    filtered.sort((a, b) => 
      sort === 'asc' ? a.tvl - b.tvl : b.tvl - a.tvl
    )

    // Filtre tokens
    if (tokens.length > 0) {
      filtered = filtered.filter(vault => 
        vault.tokens.some((t) => tokens.includes(t.symbol))
      )
    }

    // Filtre statut
    if (status !== 'all') {
      filtered = filtered.filter(vault => vault.status === status)
    }

    // Filtre utilisateur
    if (showUserVaults) {
      filtered = filtered.filter(vault => vault.userDeposit > 0)
    }

    onFilter(filtered)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <Label>Tri TVL</Label>
        <Select value={sort} onValueChange={(v: any) => setSort(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Ordre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Croissant</SelectItem>
            <SelectItem value="desc">Décroissant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Tokens</Label>
        <Input 
          placeholder="Sélectionner..." 
          value={tokens.join(', ')} 
          onChange={(e) => setTokens(e.target.value.split(',').map(t => t.trim()).filter(t => t))}
        />
      </div>

      <div>
        <Label>Statut</Label>
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="open">Ouvert</SelectItem>
            <SelectItem value="closed">Fermé</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="user-vaults" 
            checked={showUserVaults}
            onCheckedChange={(checked) => setShowUserVaults(checked as boolean)}
          />
          <Label htmlFor="user-vaults">Mes vaults</Label>
        </div>
        <Button className="ml-4" onClick={applyFilters}>Appliquer</Button>
      </div>
    </div>
  )
}
