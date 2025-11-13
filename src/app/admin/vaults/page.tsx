'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { Trash2, Plus } from 'lucide-react'
import type { VaultDefinition } from '@/types/vaults'
import { VaultForm } from '@/components/admin/VaultForm'

export default function AdminVaultsPage() {
	const router = useRouter()
	const [vaults, setVaults] = useState<VaultDefinition[]>([])
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const selected = useMemo(() => vaults.find(v => v.id === selectedId), [vaults, selectedId])

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const res = await fetch('/api/vaults', { cache: 'no-store' })

				if (!res.ok) {
					const text = await res.text().catch(() => '')
					throw new Error(
						text
							? `Erreur API /api/vaults (${res.status}) : ${text.slice(0, 120)}`
							: `Erreur API /api/vaults (${res.status})`
					)
				}

				const data = (await res.json()) as VaultDefinition[]
				if (!cancelled) setVaults(data)
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur lors du chargement')
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	const handleUpdated = (v: VaultDefinition) => {
		setVaults(prev => prev.map(x => (x.id === v.id ? v : x)))
	}

	const handleDelete = async () => {
		if (!selectedId) return
		try {
			const res = await fetch(`/api/vaults/${encodeURIComponent(selectedId)}`, { method: 'DELETE' })
			if (!res.ok && res.status !== 204) {
				const body = (await res.json().catch(() => ({}))) as { error?: string }
				throw new Error(body.error || 'Suppression impossible')
			}
			setVaults(prev => prev.filter(v => v.id !== selectedId))
			setSelectedId(null)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur lors de la suppression')
		}
	}

	return (
		<main className="min-h-screen bg-axone-dark">
			<section className="mx-auto w-full max-w-7xl px-6 py-16">
				<div className="flex flex-col gap-10">
					<header className="flex items-center justify-between">
						<div>
							<CardTitle className="text-2xl">Administration des Vaults</CardTitle>
							<CardDescription>Gérez la liste des vaults disponibles sur le site.</CardDescription>
						</div>
						<Button
							size="sm"
							variant="secondary"
							onClick={() => router.push('/admin/addVault')}
						>
							<Plus className="h-4 w-4" />
							&nbsp;Nouveau
						</Button>
					</header>

					<div className="grid gap-8 lg:grid-cols-[320px_1fr]">
						<aside>
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">Vaults existants</CardTitle>
									<CardDescription>Sélectionnez un vault pour l’éditer.</CardDescription>
								</CardHeader>
								<CardContent>
									{loading ? (
										<p className="text-sm text-vault-dim">Chargement…</p>
									) : vaults.length === 0 ? (
										<p className="text-sm text-vault-dim">Aucun vault pour le moment.</p>
									) : (
										<div className="space-y-2">
											{vaults.map(v => (
												<button
													key={v.id}
													onClick={() => setSelectedId(v.id)}
													className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
														selectedId === v.id
															? 'border-axone-accent bg-axone-accent/10 text-white'
															: 'border-white/10 text-vault-muted hover:border-axone-accent/60 hover:text-white'
													}`}
												>
													<div className="flex items-center justify-between">
														<span className="font-medium text-sm">{v.displayName}</span>
														<span className="text-xs uppercase tracking-wide text-vault-dim">{v.status}</span>
													</div>
													<p className="mt-1 text-xs text-vault-dim">{v.id} — {v.slug}</p>
												</button>
											))}
										</div>
									)}
								</CardContent>
							</Card>
							{selected && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="mt-6 text-red-300 hover:text-red-200 hover:bg-red-500/10"
									onClick={handleDelete}
								>
									<Trash2 className="h-4 w-4" />
									Supprimer
								</Button>
							)}
						</aside>
						<section>
							<Card>
								<CardHeader>
									<CardTitle className="text-lg">{selected ? `Modifier ${selected.displayName}` : 'Sélectionnez un vault'}</CardTitle>
								</CardHeader>
								<CardContent>
									{error && <p className="text-sm text-red-500 mb-4">{error}</p>}
									{selected ? (
										<VaultForm mode="edit" vault={selected} onSuccess={handleUpdated} />
									) : (
										<p className="text-sm text-vault-dim">Choisissez un vault pour l’éditer.</p>
									)}
								</CardContent>
							</Card>
						</section>
					</div>
				</div>
			</section>
		</main>
	)
}