'use client'

import { Vault } from '@/lib/vaultTypes'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Button } from '@/components/ui/button'
import { RiskBadge } from '@/components/ui/RiskBadge'
import { StatusIndicator } from '@/components/ui/StatusIndicator'
import { TokenIcon } from '@/components/ui/TokenIcon'

const COLORS = ['#fab062', '#011f26', '#4a8c8c', '#3b82f6', '#10b981']

interface VaultTableProps {
  vaults: Vault[]
}

export function VaultTable({ vaults }: VaultTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden bg-white dark:bg-gray-800">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {['Nom', 'TVL', 'Composition', 'Votre dépôt', 'Performance', 'Statut', 'Risque', 'Actions'].map((header) => (
              <th key={header} className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vaults.map((vault) => (
            <tr 
              key={vault.id} 
              className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
            >
              <td className="p-4">
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
                  <span className="font-medium text-gray-900 dark:text-white">{vault.name}</span>
                </div>
              </td>
              
              <td className="p-4 text-gray-900 dark:text-white">${vault.tvl.toLocaleString()} USDC</td>
              
              <td className="p-4">
                <div className="flex space-x-1">
                  {vault.tokens.slice(0, 3).map((token, i) => (
                    <TokenIcon key={i} symbol={token.symbol} size={18} />
                  ))}
                  {vault.tokens.length > 3 && (
                    <span className="text-gray-500 text-xs">+{vault.tokens.length - 3}</span>
                  )}
                </div>
              </td>
              
              <td className="p-4 text-gray-900 dark:text-white">${vault.userDeposit.toLocaleString()} USDC</td>
              
              <td className="p-4">
                <div className="flex items-center">
                  <span className={`mr-2 ${vault.performance30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {vault.performance30d >= 0 ? '+' : ''}{vault.performance30d}%
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
              </td>
              
              <td className="p-4"><StatusIndicator status={vault.status} /></td>
              <td className="p-4"><RiskBadge risk={vault.risk} /></td>
              
              <td className="p-4">
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">Dépôt</Button>
                  <Button size="sm" variant="outline">Retrait</Button>
                  <Button size="sm" variant="secondary" asChild>
                    <a href={`/vaults/${vault.id}`}>Infos</a>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
