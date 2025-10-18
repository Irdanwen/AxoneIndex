'use client'

import { useDashboardData } from '@/hooks/useDashboardData'
import { formatNumber, truncateAddress } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Skeleton } from '@/components/ui'
import { AlertCircle, Wallet, Database, Globe } from 'lucide-react'
import Link from 'next/link'
import { useAccount } from 'wagmi'

export default function DashboardPage() {
  const { data, isLoading, isError, error, isConfigured, address } = useDashboardData()
  const { isConnected } = useAccount()

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

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HYPE50 Defensive - Dashboard</h1>
        <p className="text-muted-foreground">
          Adresse connectée : {address ? truncateAddress(address) : 'Non connectée'}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Section Compte */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Compte
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Balance HYPE</CardTitle>
              <CardDescription>Solde natif HYPE sur HyperEVM</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatNumber(data?.hypeNativeBalance || '0', { decimals: 4 })} HYPE
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section Vault */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Vault
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Vos parts du vault</CardTitle>
                <CardDescription>Nombre de parts h50USD détenues</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.vaultShares || '0', { decimals: 6 })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Supply du Vault</CardTitle>
                <CardDescription>Supply totale des parts h50USD</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">
                    {formatNumber(data?.vaultTotalSupply || '0', { decimals: 2, compact: true })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>PPS (Prix par part)</CardTitle>
                <CardDescription>USD par part (1e18)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">
                    ${formatNumber(data?.pps || '0', { decimals: 6 })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Core Equity (USD)</CardTitle>
                <CardDescription>Valeur des positions Core (1e18)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <p className="text-2xl font-bold">
                    ${formatNumber(data?.coreEquityUsd || '0', { decimals: 2, compact: true })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section Core */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Balances Hypercore (Handler)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Soldes du Handler sur Core</CardTitle>
              <CardDescription>USDC, HYPE et BTC sur Hypercore (1e8)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Token</th>
                      <th className="text-left py-2">Token ID</th>
                      <th className="text-right py-2">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <>
                        <tr className="border-b">
                          <td className="py-2">USDC</td>
                          <td className="py-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="text-right py-2"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2">HYPE</td>
                          <td className="py-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="text-right py-2"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        </tr>
                        <tr>
                          <td className="py-2">BTC</td>
                          <td className="py-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="text-right py-2"><Skeleton className="h-4 w-24 ml-auto" /></td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr className="border-b">
                          <td className="py-2 font-medium">USDC</td>
                          <td className="py-2 text-muted-foreground">
                            {data?.coreBalances.usdc.tokenId}
                          </td>
                          <td className="text-right py-2 font-mono">
                            {data?.coreBalances.usdc.balance}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">HYPE</td>
                          <td className="py-2 text-muted-foreground">
                            {data?.coreBalances.hype.tokenId}
                          </td>
                          <td className="text-right py-2 font-mono">
                            {data?.coreBalances.hype.balance}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">BTC</td>
                          <td className="py-2 text-muted-foreground">
                            {data?.coreBalances.btc.tokenId}
                          </td>
                          <td className="text-right py-2 font-mono">
                            {data?.coreBalances.btc.balance}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-sm text-muted-foreground">Oracle BTC</div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-28" />
                  ) : (
                    <div className="text-lg font-mono">{formatNumber(data?.oraclePxBtc || '0', { decimals: 2 })}</div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Oracle HYPE</div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-28" />
                  ) : (
                    <div className="text-lg font-mono">{formatNumber(data?.oraclePxHype || '0', { decimals: 2 })}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}