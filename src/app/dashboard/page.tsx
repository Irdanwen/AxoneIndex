'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { formatNumber, truncateAddress } from '@/lib/format'
import { Card, CardContent, Button, Skeleton } from '@/components/ui'
import { AlertCircle, Wallet, Database, Globe } from 'lucide-react'
import Link from 'next/link'
import { useAccount, useChainId } from 'wagmi'
import { DashboardKpi } from '@/components/dashboard/DashboardKpi'
import { CoreBalancesTable } from '@/components/dashboard/CoreBalancesTable'

export default function DashboardPage() {
  const { data, isLoading, isError, error, isConfigured, address } = useDashboardData()
  const { isConnected } = useAccount()
  const chainId = useChainId()

  // Si pas de wallet connecté
  if (!isConnected) {
    return (
      <div className="container-custom py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connectez votre wallet</h2>
            <p className="text-muted-foreground">Veuillez connecter votre wallet pour accéder au dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si configuration manquante
  if (!isConfigured) {
    return (
      <div className="container-custom py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Configuration requise</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez configurer les adresses dans Admin Vaults
            </p>
            <Link href="/admin/vaults">
              <Button>Aller à Admin Vaults</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si erreur
  if (isError) {
    return (
      <div className="container-custom py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Erreur</h2>
            <p className="text-muted-foreground">{error?.message || 'Une erreur est survenue'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const coreBalanceRows = [
    {
      token: 'USDC',
      tokenId: data?.coreBalances?.usdc?.tokenId?.toString() ?? '—',
      balance: data?.coreBalances?.usdc?.balance ?? '—',
    },
    {
      token: 'HYPE',
      tokenId: data?.coreBalances?.hype?.tokenId?.toString() ?? '—',
      balance: data?.coreBalances?.hype?.balance ?? '—',
    },
    {
      token: 'BTC',
      tokenId: data?.coreBalances?.btc?.tokenId?.toString() ?? '—',
      balance: data?.coreBalances?.btc?.balance ?? '—',
    },
  ]

  return (
    <div className="container-custom py-8">
      {chainId !== 998 && (
        <div className="mb-6 rounded-xl border border-[var(--border-muted)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Vous n’êtes pas connecté au réseau HyperEVM Testnet (998). Certaines données peuvent être indisponibles.
          </p>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="[&>*+*]:mt-6">
          <section className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="[&>*+*]:mt-2">
              <h1 className="text-2xl font-semibold text-[var(--text-secondary)]">STRATEGY_1</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Dashboard opérationnel du vault STRATEGY_1.
              </p>
            </div>
            <div className="mt-6 [&>*+*]:mt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                Adresse connectée
              </p>
              <p className="font-mono text-sm text-[var(--text-secondary)]">
                {address ? truncateAddress(address) : 'Non connectée'}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              <Wallet className="h-4 w-4" />
              Compte
            </div>
            <div className="mt-6 [&>*+*]:mt-2">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Balance HYPE</p>
              <div className="text-3xl font-semibold text-[var(--text-secondary)]">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <span>
                    {formatNumber(data?.hypeNativeBalance || '0', { decimals: 4 })} <span className="text-lg">HYPE</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Solde natif HYPE sur HyperEVM</p>
            </div>
          </section>
        </aside>

        <main className="[&>*+*]:mt-6">
          <section className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] p-6 shadow-sm">
            <header className="flex flex-col gap-2 border-b border-[var(--border-muted)] pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                <Database className="h-4 w-4" />
                Vault
              </div>
              <p className="text-sm text-[var(--text-secondary)]">Performances et métriques du vault sAXN1.</p>
            </header>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DashboardKpi
                label="Vos parts du vault"
                value={<span className="font-mono">{formatNumber(data?.vaultShares || '0', { decimals: 6 })}</span>}
                isLoading={isLoading}
              />
              <DashboardKpi
                label="Total supply du vault"
                value={
                  <span className="font-mono">
                    {formatNumber(data?.vaultTotalSupply || '0', { decimals: 2, compact: true })}
                  </span>
                }
                isLoading={isLoading}
              />
              <DashboardKpi
                label="PPS (Prix par part)"
                value={<span className="font-mono">${formatNumber(data?.ppsDisplay || data?.pps || '0', { decimals: 4 })}</span>}
                isLoading={isLoading}
              />
              <DashboardKpi
                label="Core equity (USD)"
                value={
                  <span className="font-mono">
                    ${formatNumber(data?.coreEquityDisplay || data?.coreEquityUsd || '0', { decimals: 2, compact: true })}
                  </span>
                }
                isLoading={isLoading}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] p-6 shadow-sm">
            <header className="flex flex-col gap-2 border-b border-[var(--border-muted)] pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                <Globe className="h-4 w-4" />
                Balances Hypercore (Handler)
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Soldes USDC, HYPE et BTC sur Hypercore convertis selon les décimales natives.
              </p>
            </header>
            <div className="mt-6">
              <CoreBalancesTable balances={coreBalanceRows} isLoading={isLoading} />
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Oracle BTC (USD)</p>
                <div className="mt-2 text-lg font-mono text-[var(--text-secondary)]">
                  {isLoading ? (
                    <Skeleton className="h-6 w-28" />
                  ) : (
                    formatNumber(data?.oraclePxBtc || '0', { decimals: 2 })
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border-muted)] bg-[var(--surface)] p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Oracle HYPE (USD)</p>
                <div className="mt-2 text-lg font-mono text-[var(--text-secondary)]">
                  {isLoading ? (
                    <Skeleton className="h-6 w-28" />
                  ) : (
                    formatNumber(data?.oraclePxHype || '0', { decimals: 2 })
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}