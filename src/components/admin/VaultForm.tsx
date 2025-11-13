'use client'

import { useEffect, useMemo, useState } from 'react'
import { isAddress } from 'viem'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Card, CardContent } from '@/components/ui'
import type { NewVaultInput, VaultDefinition, UpdateVaultInput } from '@/types/vaults'

type Props = {
	onSuccess?: (createdOrUpdated: VaultDefinition) => void
	mode?: 'create' | 'edit'
	vault?: VaultDefinition
}

export function VaultForm({ onSuccess, mode = 'create', vault }: Props) {
	const [form, setForm] = useState<NewVaultInput>(() => {
		if (mode === 'edit' && vault) {
			return {
				displayName: vault.displayName,
				description: vault.description,
				risk: vault.risk,
				status: vault.status,
				iconUrl: vault.iconUrl,
				tags: vault.tags || [],
				chainId: vault.chainId,
				vaultAddress: vault.vaultAddress,
				handlerAddress: vault.handlerAddress,
				l1ReadAddress: vault.l1ReadAddress,
				usdcAddress: vault.usdcAddress,
				coreTokenIds: { ...vault.coreTokenIds },
			}
		}
		return {
			displayName: '',
			description: '',
			risk: 'medium',
			status: 'open',
			iconUrl: '',
			tags: [],
			chainId: 998,
			vaultAddress: '0x',
			handlerAddress: '0x',
			l1ReadAddress: '0x',
			usdcAddress: '0x',
			coreTokenIds: { usdc: 0, hype: 0, btc: 0 },
		}
	})
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (mode === 'edit' && vault) {
			setForm({
				displayName: vault.displayName,
				description: vault.description,
				risk: vault.risk,
				status: vault.status,
				iconUrl: vault.iconUrl,
				tags: vault.tags || [],
				chainId: vault.chainId,
				vaultAddress: vault.vaultAddress,
				handlerAddress: vault.handlerAddress,
				l1ReadAddress: vault.l1ReadAddress,
				usdcAddress: vault.usdcAddress,
				coreTokenIds: { ...vault.coreTokenIds },
			})
		}
	}, [mode, vault])

	const tagsAsString = useMemo(() => (form.tags || []).join(', '), [form.tags])

	const setField = <K extends keyof NewVaultInput>(key: K, value: NewVaultInput[K]) => {
		setForm(prev => ({ ...prev, [key]: value }))
	}

	const validate = (): string | null => {
		if (!form.displayName.trim()) return 'Le nom d’affichage est requis.'
		if (!['low', 'medium', 'high'].includes(form.risk)) return 'Risque invalide.'
		if (!['open', 'closed', 'paused'].includes(form.status)) return 'Statut invalide.'
		if (!Number.isFinite(form.chainId)) return 'chainId invalide.'
		if (!isAddress(form.vaultAddress)) return 'Adresse du Vault invalide.'
		if (!isAddress(form.handlerAddress)) return 'Adresse du Handler invalide.'
		if (!isAddress(form.l1ReadAddress)) return 'Adresse L1Read invalide.'
		if (!isAddress(form.usdcAddress)) return 'Adresse USDC invalide.'
		if (![form.coreTokenIds.usdc, form.coreTokenIds.hype, form.coreTokenIds.btc].every(n => Number.isFinite(n))) {
			return 'coreTokenIds invalides.'
		}
		return null
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		const v = validate()
		if (v) {
			setError(v)
			return
		}
		setSubmitting(true)
		try {
			if (mode === 'create') {
				const res = await fetch('/api/vaults', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form),
				})
				if (!res.ok) {
					const body = (await res.json().catch(() => ({}))) as { error?: string }
					throw new Error(body.error || 'Impossible de créer le vault')
				}
				const created = (await res.json()) as VaultDefinition
				onSuccess?.(created)
			} else {
				if (!vault) throw new Error('Vault introuvable')
				const changes: UpdateVaultInput = { ...form }
				const res = await fetch(`/api/vaults/${encodeURIComponent(vault.id)}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(changes),
				})
				if (!res.ok) {
					const body = (await res.json().catch(() => ({}))) as { error?: string }
					throw new Error(body.error || 'Impossible de mettre à jour le vault')
				}
				const updated = (await res.json()) as VaultDefinition
				onSuccess?.(updated)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erreur inconnue')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<Card>
				<CardContent className="pt-6 space-y-6">
					<div className="space-y-2">
						<Label htmlFor="displayName">Nom d’affichage</Label>
						<Input id="displayName" value={form.displayName} onChange={(e) => setField('displayName', e.target.value)} placeholder="Era 1 - BTC50 Defensive" />
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea id="description" value={form.description || ''} onChange={(e) => setField('description', e.target.value)} placeholder="Résumé de la stratégie…" />
					</div>
					<div className="grid sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Risque</Label>
							<Select value={form.risk} onValueChange={(value) => setField('risk', value as NewVaultInput['risk'])}>
								<SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="low">Faible</SelectItem>
									<SelectItem value="medium">Moyen</SelectItem>
									<SelectItem value="high">Élevé</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Statut</Label>
							<Select value={form.status} onValueChange={(value) => setField('status', value as NewVaultInput['status'])}>
								<SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="open">Ouvert</SelectItem>
									<SelectItem value="paused">En pause</SelectItem>
									<SelectItem value="closed">Fermé</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="chainId">Chain ID</Label>
							<Input id="chainId" type="number" value={form.chainId} onChange={(e) => setField('chainId', Number(e.target.value) || 0)} />
						</div>
					</div>

					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="vaultAddress">Adresse du Vault</Label>
							<Input id="vaultAddress" value={form.vaultAddress} onChange={(e) => setField('vaultAddress', e.target.value as NewVaultInput['vaultAddress'])} placeholder="0x…" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="handlerAddress">Adresse du Handler</Label>
							<Input id="handlerAddress" value={form.handlerAddress} onChange={(e) => setField('handlerAddress', e.target.value as NewVaultInput['handlerAddress'])} placeholder="0x…" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="l1ReadAddress">Adresse L1Read</Label>
							<Input id="l1ReadAddress" value={form.l1ReadAddress} onChange={(e) => setField('l1ReadAddress', e.target.value as NewVaultInput['l1ReadAddress'])} placeholder="0x…" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="usdcAddress">Adresse USDC</Label>
							<Input id="usdcAddress" value={form.usdcAddress} onChange={(e) => setField('usdcAddress', e.target.value as NewVaultInput['usdcAddress'])} placeholder="0x…" />
						</div>
					</div>

					<div className="grid sm:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="coreUsdc">Core Token ID — USDC</Label>
							<Input id="coreUsdc" type="number" value={form.coreTokenIds.usdc} onChange={(e) => setField('coreTokenIds', { ...form.coreTokenIds, usdc: Number(e.target.value) || 0 } as NewVaultInput['coreTokenIds'])} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="coreHype">Core Token ID — HYPE</Label>
							<Input id="coreHype" type="number" value={form.coreTokenIds.hype} onChange={(e) => setField('coreTokenIds', { ...form.coreTokenIds, hype: Number(e.target.value) || 0 } as NewVaultInput['coreTokenIds'])} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="coreBtc">Core Token ID — BTC</Label>
							<Input id="coreBtc" type="number" value={form.coreTokenIds.btc} onChange={(e) => setField('coreTokenIds', { ...form.coreTokenIds, btc: Number(e.target.value) || 0 } as NewVaultInput['coreTokenIds'])} />
						</div>
					</div>

					<div className="grid sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="iconUrl">Icône (URL)</Label>
							<Input id="iconUrl" value={form.iconUrl || ''} onChange={(e) => setField('iconUrl', e.target.value)} placeholder="https://…" />
						</div>
						<div className="space-y-2">
							<Label htmlFor="tags">Tags (séparés par des virgules)</Label>
							<Input
								id="tags"
								value={tagsAsString}
								onChange={(e) => setField('tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
								placeholder="btc, defensive, core"
							/>
						</div>
					</div>

					{error && <p className="text-sm text-red-500">{error}</p>}
					<div className="flex gap-3">
						<Button type="submit" disabled={submitting}>{submitting ? 'Enregistrement…' : (mode === 'create' ? 'Créer' : 'Enregistrer')}</Button>
					</div>
				</CardContent>
			</Card>
		</form>
	)
}


