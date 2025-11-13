'use client'

import { useCallback, useEffect, useState } from 'react'
import type { VaultDefinition } from '@/types/vaults'

export function useVaults() {
	const [vaults, setVaults] = useState<VaultDefinition[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const reload = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await fetch('/api/vaults', { cache: 'no-store' })
			const data = (await res.json()) as VaultDefinition[]
			setVaults(data)
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erreur de chargement')
		} finally {
			setLoading(false)
		}
	}, [])

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
				if (!cancelled) setLoading(false)
			}
		})()
		return () => { cancelled = true }
	}, [])

	return { vaults, loading, error, reload, setVaults }
}


