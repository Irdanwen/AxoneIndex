'use client'

import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Wallet, 
  PieChart, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface VaultDashboardProps {
  totalDeposited: number
  globalYield: number
  activeVaults: number
  totalVaults: number
}

export function VaultDashboard({ 
  totalDeposited, 
  globalYield, 
  activeVaults,
  totalVaults 
}: VaultDashboardProps) {
  const isPositiveYield = globalYield >= 0

  const stats = [
    {
      label: 'Total déposé',
      value: `$${totalDeposited.toLocaleString('fr-FR')}`,
      subValue: 'USDC',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-vault-brand',
      bgColor: 'bg-vault-brand-muted'
    },
    {
      label: 'Rendement global',
      value: `${isPositiveYield ? '+' : ''}${globalYield.toFixed(2)}%`,
      subValue: '30 derniers jours',
      icon: isPositiveYield ? 
        <TrendingUp className="w-5 h-5" /> : 
        <ArrowDownRight className="w-5 h-5" />,
      color: isPositiveYield ? 'text-green-400' : 'text-red-400',
      bgColor: isPositiveYield ? 'bg-green-400/10' : 'bg-red-400/10',
      trend: isPositiveYield ? 
        <ArrowUpRight className="w-4 h-4" /> : 
        <ArrowDownRight className="w-4 h-4" />
    },
    {
      label: 'Vaults actifs',
      value: activeVaults.toString(),
      subValue: `sur ${totalVaults} disponibles`,
      icon: <PieChart className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    }
  ]

  return (
    <div className="mb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold text-vault-primary mb-2">
          Tableau de bord
        </h1>
        <p className="text-vault-muted">
          Vue d&apos;ensemble de vos investissements et performances
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-vault-card border border-vault rounded-xl p-6 hover:border-vault-strong transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              {stat.trend && (
                <div className={stat.color}>
                  {stat.trend}
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-vault-muted mb-1">
                {stat.label}
              </p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              {stat.subValue && (
                <p className="text-xs text-vault-dim mt-1">
                  {stat.subValue}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick insights */}
      {totalDeposited > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 p-4 bg-vault-muted/30 border border-vault rounded-lg"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-vault-brand animate-pulse" />
            <p className="text-sm text-vault-muted">
              {activeVaults > 0 ? (
                <>
                  Vous avez des positions actives dans <span className="text-vault-brand font-medium">{activeVaults} vault{activeVaults > 1 ? 's' : ''}</span>
                  {isPositiveYield && ' avec un rendement positif'}
                </>
              ) : (
                'Aucune position active pour le moment'
              )}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}