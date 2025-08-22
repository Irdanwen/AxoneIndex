'use client'

import { Vault } from '@/lib/vaultTypes'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { TokenIcon } from '@/components/ui/TokenIcon'

const COLORS = ['#fab062', '#011f26', '#4a8c8c', '#3b82f6', '#10b981']

interface VaultCardProps {
  vault: Vault
}

export function VaultCard({ vault }: VaultCardProps) {
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden">
      {/* En-tête avec nom et statut */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-800/50">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vault.tokens}
                    dataKey="percentage"
                    outerRadius={18}
                    innerRadius={12}
                    paddingAngle={1}
                  >
                    {vault.tokens.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{vault.name}</h3>
              <StatusIndicator status={vault.status} className="mt-1" />
            </div>
          </div>
          <RiskBadge risk={vault.risk} />
        </div>
      </div>

      {/* Corps principal */}
      <div className="p-4">
        {/* TVL - Typo plus grande */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">${vault.tvl.toLocaleString()}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">USDC</div>
        </div>

        {/* Composition des tokens */}
        <div className="flex items-center mb-4">
          <div className="flex -space-x-2 mr-2">
            {vault.tokens.slice(0, 3).map((token, i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800">
                <TokenIcon symbol={token.symbol} size={24} />
              </div>
            ))}
          </div>
          {vault.tokens.length > 3 && (
            <span className="text-xs text-gray-500">+{vault.tokens.length - 3}</span>
          )}
        </div>

        {/* Performance avec flèche */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${vault.performance30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {vault.performance30d >= 0 ? '📈' : '📉'} {vault.performance30d >= 0 ? '+' : ''}{vault.performance30d}%
            </span>
            <div className="w-16 h-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateSparklineData(vault.performance30d)}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={vault.performance30d >= 0 ? '#10b981' : '#ef4444'} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Dépôt utilisateur en badge coloré */}
        {vault.userDeposit > 0 && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
              💵 ${vault.userDeposit.toLocaleString()} USDC
            </span>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex space-x-2">
          <Button size="sm" variant="default">
            <span className="mr-1">💰</span> Dépôt
          </Button>
          <Button size="sm" variant="secondary">
            <span className="mr-1">↩️</span> Retrait
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={`/vaults/${vault.id}`}>
              <span className="text-lg">ℹ️</span>
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

function generateSparklineData(performance: number) {
  const base = 50
  const fluctuation = Math.abs(performance) * 0.5
  return Array.from({ length: 30 }, (_, i) => ({
    day: i,
    value: base + (performance >= 0 ? 1 : -1) * fluctuation * Math.sin(i / 5)
  }))
}
