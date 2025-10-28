'use client'

import { ArrowDownRight, PieChart, TrendingUp, Wallet } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface VaultDashboardProps {
  totalDeposited: number
  globalYield: number
  activeVaults: number
  totalVaults: number
  variant?: 'default' | 'dense'
}

const baseFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

export function VaultDashboard({
  totalDeposited,
  globalYield,
  activeVaults,
  totalVaults,
  variant = 'default'
}: VaultDashboardProps) {
  const isDense = variant === 'dense'
  const labelClass = isDense
    ? 'text-xs font-medium uppercase tracking-wide text-vault-muted'
    : 'text-sm font-medium uppercase tracking-wide text-vault-muted'
  const valueClass = isDense
    ? 'text-xl font-semibold text-vault-primary'
    : 'text-2xl font-semibold text-vault-primary'
  const helperClass = isDense
    ? 'text-xs text-vault-dim'
    : 'text-sm text-vault-dim'
  const headerTitleClass = isDense
    ? 'text-2xl font-semibold text-vault-primary'
    : 'text-3xl font-semibold text-vault-primary'
  const headerDescriptionClass = isDense
    ? 'text-sm text-vault-muted'
    : 'text-base text-vault-muted'
  const cardPadding = isDense ? 'p-4' : 'p-6'

  const yieldValue = `${globalYield >= 0 ? '+' : ''}${globalYield.toFixed(2)}%`
  const stats = [
    {
      label: 'Total déposé',
      value: `$${baseFormatter.format(totalDeposited)}`,
      helper: 'Capital engagé',
      icon: Wallet
    },
    {
      label: 'Rendement global',
      value: yieldValue,
      helper: 'Sur 30 jours',
      icon: globalYield >= 0 ? TrendingUp : ArrowDownRight
    },
    {
      label: 'Vaults actifs',
      value: activeVaults.toString(),
      helper: `sur ${totalVaults}`,
      icon: PieChart
    }
  ]

  return (
    <div className={isDense ? 'space-y-6' : 'space-y-8'}>
      <header className="flex flex-col gap-2">
        <h1 className={headerTitleClass}>Tableau de bord</h1>
        <p className={headerDescriptionClass}>
          Vue d&apos;ensemble synthétique de vos positions et performances
        </p>
      </header>

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${isDense ? 'gap-3' : 'gap-4'}`}>
        {stats.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="vault-surface border border-vault shadow-vault-sm">
            <CardContent className={`flex items-center gap-4 ${cardPadding}`}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full vault-surface-alt">
                <Icon className="h-5 w-5 text-vault-muted" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className={labelClass}>{label}</span>
                <span className={valueClass}>{value}</span>
                <span className={helperClass}>{helper}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
