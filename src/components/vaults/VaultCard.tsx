'use client'

import { Vault } from '@/lib/vaultTypes'
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui'

interface VaultCardProps {
  vault: Vault
  onDeposit?: () => void
  onWithdraw?: () => void
  onInfo?: () => void
}

export function VaultCard({ vault, onDeposit, onWithdraw, onInfo }: VaultCardProps) {
  const isPositive = vault.performance30d >= 0
  const hasDeposit = vault.userDeposit > 0
  
  // Risk colors
  const riskColors = {
    low: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10', 
    high: 'text-red-400 bg-red-400/10'
  }
  
  const riskIcons = {
    low: <Shield className="w-3.5 h-3.5" />,
    medium: <AlertTriangle className="w-3.5 h-3.5" />,
    high: <Activity className="w-3.5 h-3.5" />
  }
  
  // Status styles
  const statusStyles = {
    open: 'bg-green-400/10 text-green-400',
    paused: 'bg-yellow-400/10 text-yellow-400',
    closed: 'bg-red-400/10 text-red-400'
  }
  
  const statusLabels = {
    open: 'Actif',
    paused: 'En pause',
    closed: 'Fermé'
  }

  return (
    <div className="bg-vault-card border border-vault rounded-xl overflow-hidden hover-vault-card group h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-vault">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-vault-primary mb-1">
              {vault.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[vault.status]}`}>
                {statusLabels[vault.status]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${riskColors[vault.risk]}`}>
                {riskIcons[vault.risk]}
                {vault.risk === 'low' ? 'Faible' : vault.risk === 'medium' ? 'Moyen' : 'Élevé'}
              </span>
            </div>
          </div>
        </div>

        {/* Token composition */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {vault.tokens.slice(0, 4).map((token, i) => (
              <div 
                key={i} 
                className="w-6 h-6 rounded-full bg-vault-muted border border-vault flex items-center justify-center text-xs font-medium text-vault-muted"
                style={{ zIndex: vault.tokens.length - i }}
              >
                {token.symbol.slice(0, 2)}
              </div>
            ))}
          </div>
          <span className="text-xs text-vault-dim">
            {vault.tokens.map(t => `${t.symbol} ${t.percentage}%`).join(' • ')}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
        {/* TVL */}
        <div>
          <p className="text-xs text-vault-muted mb-1">TVL (Total Value Locked)</p>
          <p className="text-2xl font-bold text-vault-primary">
            ${vault.tvl.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Performance */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-vault-muted/30">
          <div>
            <p className="text-xs text-vault-muted mb-1">Performance 30j</p>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{vault.performance30d.toFixed(2)}%
              </span>
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          {isPositive ? (
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          )}
        </div>

        {/* User deposit if exists */}
        {hasDeposit && (
          <div className="p-3 rounded-lg bg-vault-brand-muted border border-vault-brand/20">
            <p className="text-xs text-vault-brand mb-1">Mon dépôt</p>
            <p className="text-lg font-semibold text-vault-brand">
              ${vault.userDeposit.toLocaleString('fr-FR')} USDC
            </p>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onDeposit}
            className="flex-1 px-4 py-2.5 bg-vault-brand hover:bg-vault-brand/90 text-black font-medium rounded-lg transition-colors"
            disabled={vault.status === 'closed'}
          >
            Déposer
          </button>
          <button
            onClick={onWithdraw}
            className="flex-1 px-4 py-2.5 bg-vault-muted hover:bg-vault-muted/80 text-vault-primary font-medium rounded-lg transition-colors"
            disabled={!hasDeposit}
          >
            Retirer
          </button>
          <button
            onClick={onInfo}
            className="px-3 py-2.5 bg-vault-muted hover:bg-vault-muted/80 text-vault-primary rounded-lg transition-colors"
            aria-label="Plus d'informations"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
