'use client'

import { useEffect, useState } from 'react'
import type { VaultDefinition } from '@/types/vaults'

export function useVaultBySlug(slug: string | undefined) {
	const [vault, setVault] = useState<VaultDefinition | null>(null)
	const [loading, setLoading] = useState<boolean>(!!slug)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!slug) return
		let cancelled = false
		setLoading(true)
		setError(null)
		;(async () => {
			try {
				const url = `/api/vaults?slug=${encodeURIComponent(slug)}`
				const res = await fetch(url, { cache: 'no-store' })
				if (!res.ok) {
					const body = (await res.json().catch(() => ({}))) as { error?: string }
					throw new Error(body.error || 'Vault introuvable')
				}
				const data = (await res.json()) as VaultDefinition
				if (!cancelled) setVault(data)
			} catch (e) {
				if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement')
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => { cancelled = true }
	}, [slug])

	return { vault, loading, error }
}


