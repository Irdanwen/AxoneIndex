'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Filter, 
  ChevronDown,
  X, 
  TrendingUp, 
  TrendingDown,
  Shield,
  AlertTriangle,
  Activity,
  DollarSign,
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VaultDefinition } from '@/types/vaults'

type VaultFilterItem = VaultDefinition & {
  tokens?: { symbol: string; percentage?: number }[]
  tvlUsd?: number
  userDepositUsd?: number
  performance30d?: number
}

interface VaultFiltersProps {
  vaults: VaultFilterItem[]
  onFilter: (vaults: VaultFilterItem[]) => void
}

export function VaultFilters({ vaults, onFilter }: VaultFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'tvl' | 'performance' | 'risk'>('tvl')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedTokens, setSelectedTokens] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'closed' | 'paused'>('all')
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [showUserVaults, setShowUserVaults] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [availableTokens, setAvailableTokens] = useState<string[]>([])

  // Extract available tokens
  useEffect(() => {
    const tokensSet = new Set<string>()
    vaults.forEach(vault => {
      if (vault.tokens?.length) {
        vault.tokens.forEach(token => tokensSet.add(token.symbol))
      }
      if (vault.tags?.length) {
        vault.tags.forEach(tag => tokensSet.add(tag))
      }
    })
    setAvailableTokens(Array.from(tokensSet).sort())
  }, [vaults])

  const toggleToken = (token: string) => {
    setSelectedTokens(prev => 
      prev.includes(token) 
        ? prev.filter(t => t !== token) 
        : [...prev, token]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSortBy('tvl')
    setSortOrder('desc')
    setSelectedTokens([])
    setSelectedStatus('all')
    setSelectedRisk('all')
    setShowUserVaults(false)
  }

  const hasActiveFilters = 
    searchTerm || 
    selectedTokens.length > 0 || 
    selectedStatus !== 'all' || 
    selectedRisk !== 'all' || 
    showUserVaults

  const applyFilters = useCallback(() => {
    let filtered = [...vaults]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vault => 
        vault.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vault.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vault.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        vault.tokens?.some(t => t.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Token filter
    if (selectedTokens.length > 0) {
      filtered = filtered.filter(vault => 
        vault.tokens?.some(t => selectedTokens.includes(t.symbol)) ||
        vault.tags?.some(tag => selectedTokens.includes(tag))
      )
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(vault => vault.status === selectedStatus)
    }

    // Risk filter
    if (selectedRisk !== 'all') {
      filtered = filtered.filter(vault => vault.risk === selectedRisk)
    }

    // User vaults filter (basé sur userDepositUsd)
    if (showUserVaults) {
      filtered = filtered.filter(vault => (vault.userDepositUsd ?? 0) > 0)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'tvl':
          comparison = (a.tvlUsd ?? 0) - (b.tvlUsd ?? 0)
          break
        case 'performance':
          comparison = (a.performance30d ?? 0) - (b.performance30d ?? 0)
          break
        case 'risk':
          const riskOrder = { low: 1, medium: 2, high: 3 }
          comparison = riskOrder[a.risk] - riskOrder[b.risk]
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    onFilter(filtered)
  }, [vaults, searchTerm, selectedTokens, selectedStatus, selectedRisk, showUserVaults, sortBy, sortOrder, onFilter])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const sortOptions = [
    { value: 'tvl', label: 'TVL', icon: <DollarSign className="w-4 h-4" /> },
    { value: 'performance', label: 'Performance', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'risk', label: 'Risque', icon: <Shield className="w-4 h-4" /> }
  ]

  const statusOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'open', label: 'Actif', color: 'text-green-400' },
    { value: 'paused', label: 'En pause', color: 'text-yellow-400' },
    { value: 'closed', label: 'Fermé', color: 'text-red-400' }
  ]

  const riskOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'low', label: 'Faible', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-green-400' },
    { value: 'medium', label: 'Moyen', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: 'text-yellow-400' },
    { value: 'high', label: 'Élevé', icon: <Activity className="w-3.5 h-3.5" />, color: 'text-red-400' }
  ]

  return (
    <div className="mb-6">
      {/* Search and main controls */}
      <div className="flex flex-col lg:flex-row gap-4" style={{ marginBottom: '2rem' }}>
        {/* Search bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vault-dim" />
          <input
            type="text"
            placeholder="Rechercher un vault ou token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-vault-card border border-vault rounded-lg text-vault-primary placeholder-vault-dim focus:outline-none focus:border-vault-brand transition-colors"
          />
        </div>

        {/* Sort controls */}
        <div className="flex gap-2">
          {/* Sort by */}
          <div className="relative">
            <button className="px-4 py-3 bg-vault-card border border-vault rounded-lg text-vault-primary flex items-center gap-2 hover:border-vault-strong transition-colors">
              {sortOptions.find(o => o.value === sortBy)?.icon}
              <span className="text-sm">Trier: {sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Sort order */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-3 bg-vault-card border border-vault rounded-lg text-vault-primary hover:border-vault-strong transition-colors"
            aria-label={`Tri ${sortOrder === 'desc' ? 'décroissant' : 'croissant'}`}
          >
            {sortOrder === 'desc' ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </button>

          {/* Toggle filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 bg-vault-card border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'border-vault-brand text-vault-brand' : 'border-vault text-vault-primary hover:border-vault-strong'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm">Filtres</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-vault-brand" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-vault-card border border-vault rounded-lg" style={{ gap: '2rem' }}>
              <div className="space-y-4">
              {/* Quick filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowUserVaults(!showUserVaults)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    showUserVaults 
                      ? 'bg-vault-brand text-black' 
                      : 'bg-vault-muted text-vault-primary hover:bg-vault-muted/80'
                  }`}
                >
                  Mes vaults
                </button>
              </div>

              {/* Status filter */}
              <div>
                <p className="text-xs text-vault-muted mb-2">Statut</p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value as 'all' | 'open' | 'closed' | 'paused')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedStatus === option.value
                          ? 'bg-vault-brand text-black'
                          : `bg-vault-muted text-vault-primary hover:bg-vault-muted/80 ${option.color || ''}`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Risk filter */}
              <div>
                <p className="text-xs text-vault-muted mb-2">Niveau de risque</p>
                <div className="flex flex-wrap gap-2">
                  {riskOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedRisk(option.value as 'all' | 'low' | 'medium' | 'high')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                        selectedRisk === option.value
                          ? 'bg-vault-brand text-black'
                          : `bg-vault-muted text-vault-primary hover:bg-vault-muted/80 ${option.color || ''}`
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token filter */}
              {availableTokens.length > 0 && (
                <div>
                  <p className="text-xs text-vault-muted mb-2">Tokens</p>
                  <div className="flex flex-wrap gap-2">
                    {availableTokens.map(token => (
                      <button
                        key={token}
                        onClick={() => toggleToken(token)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedTokens.includes(token)
                            ? 'bg-vault-brand text-black'
                            : 'bg-vault-muted text-vault-primary hover:bg-vault-muted/80'
                        }`}
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser les filtres
                </button>
              )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active filters display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: '2rem' }}>
          {searchTerm && (
            <span className="px-2 py-1 bg-vault-muted rounded-lg text-xs text-vault-muted flex items-center gap-1">
              Recherche: {searchTerm}
              <button onClick={() => setSearchTerm('')}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {showUserVaults && (
            <span className="px-2 py-1 bg-vault-brand/20 text-vault-brand rounded-lg text-xs flex items-center gap-1">
              Mes vaults
              <button onClick={() => setShowUserVaults(false)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTokens.map(token => (
            <span key={token} className="px-2 py-1 bg-vault-muted rounded-lg text-xs text-vault-muted flex items-center gap-1">
              {token}
              <button onClick={() => toggleToken(token)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
