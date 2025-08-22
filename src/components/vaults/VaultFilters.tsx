'use client'

import { useState, useEffect } from 'react'
import { Vault } from '@/lib/vaultTypes'
import { Button } from '@/components/ui'

interface VaultFiltersProps {
  vaults: Vault[]
  onFilter: (vaults: Vault[]) => void
}

export function VaultFilters({ vaults, onFilter }: VaultFiltersProps) {
  const [sort, setSort] = useState<'asc' | 'desc'>('desc')
  const [tokens, setTokens] = useState<string[]>([])
  const [status, setStatus] = useState<'all' | 'open' | 'closed' | 'paused'>('all')
  const [showUserVaults, setShowUserVaults] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<string[]>([])

  // Extraire les tokens disponibles
  useEffect(() => {
    const tokensSet = new Set<string>()
    vaults.forEach(vault => {
      vault.tokens.forEach(token => tokensSet.add(token.symbol))
    })
    setAvailableTokens(Array.from(tokensSet))
  }, [vaults])

  const toggleToken = (token: string) => {
    setTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token) 
        : [...prev, token]
    )
  }

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

  // Appliquer les filtres à chaque changement
  useEffect(() => {
    applyFilters()
  }, [sort, tokens, status, showUserVaults, vaults])

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tri TVL */}
        <Button
          variant={sort === 'desc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSort(sort === 'desc' ? 'asc' : 'desc')}
          className="flex items-center"
        >
          {sort === 'desc' ? '🔽' : '🔼'} TVL
        </Button>

        {/* Tokens disponibles */}
        {availableTokens.map(token => (
          <Button
            key={token}
            variant={tokens.includes(token) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleToken(token)}
          >
            {token}
          </Button>
        ))}

        {/* Statut */}
        {status !== 'all' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatus('all')}
            className="bg-gray-100 dark:bg-gray-800"
          >
            Statut: {status === 'open' ? 'Ouvert' : status === 'paused' ? 'En pause' : 'Fermé'}
            <span className="ml-1">×</span>
          </Button>
        )}
        {status === 'all' && (
          <>
            <Button variant="outline" size="sm" onClick={() => setStatus('open')}>Ouvert</Button>
            <Button variant="outline" size="sm" onClick={() => setStatus('paused')}>En pause</Button>
          </>
        )}

        {/* Mes vaults */}
        {showUserVaults && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUserVaults(false)}
            className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
          >
            Mes vaults
            <span className="ml-1">×</span>
          </Button>
        )}
      </div>
    </div>
  )
}
