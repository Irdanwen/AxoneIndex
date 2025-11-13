'use client'

import { useEffect, useState } from 'react'
import Footer from '@/components/layout/Footer'
import GlassCard from '@/components/ui/GlassCard'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { Loader2 } from 'lucide-react'
import { useChainId } from 'wagmi'
import type { VaultDefinition } from '@/types/vaults'

export default function MarketPage() {
  const chainId = useChainId()
  const [vaults, setVaults] = useState<VaultDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/vaults', { cache: 'no-store' })
        const data = (await res.json()) as VaultDefinition[]
        if (!cancelled) setVaults(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="min-h-screen bg-axone-dark">
      <section className="market-shell mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-10">
          <header>
            {chainId !== 998 && (
              <div className="mt-4">
                <GlassCard className="p-4">
                  <p className="text-sm text-white-80">
                    Vous n’êtes pas connecté au réseau HyperEVM Testnet (998). Veuillez changer de réseau pour interagir avec le market des vaults.
                  </p>
                </GlassCard>
              </div>
            )}
            <span className="text-sm font-medium uppercase tracking-wide text-vault-muted mb-1 block">
              Gestion des stratégies
            </span>
            <h1 className="text-4xl font-semibold text-vault-primary mb-2">
              Marché des vaults
            </h1>
            <p className="text-base text-vault-muted">
              Explorez et gérez vos opportunités d&apos;investissement en quelques clics.
            </p>
            <div className="mt-6">
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin/vaults">Gérer mes vaults</Link>
              </Button>
            </div>
          </header>

          <div className="flex flex-col gap-8">
            {isLoading ? (
              <GlassCard className="py-16 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-white-60 inline-block" />
              </GlassCard>
            ) : error ? (
              <GlassCard className="p-10 text-center">
                <p className="text-sm text-red-500">{error}</p>
              </GlassCard>
            ) : vaults.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <p className="text-base font-medium text-vault-muted">Aucun vault disponible.</p>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {vaults.map(v => (
                  <GlassCard key={v.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-vault-primary">{v.displayName}</h3>
                      <span className="text-xs uppercase tracking-wide text-vault-dim">{v.status}</span>
                    </div>
                    {v.description && <p className="mt-2 text-sm text-vault-muted">{v.description}</p>}
                    <div className="mt-4">
                      <Button asChild size="sm">
                        <Link href={`/vault/${v.slug}`}>Ouvrir</Link>
                      </Button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
