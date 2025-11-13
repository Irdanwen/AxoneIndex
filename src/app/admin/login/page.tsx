'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'

function AdminLoginForm() {
	const router = useRouter()
	const search = useSearchParams()
	const nextAfter = search?.get('next') || '/admin/vaults'

	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const res = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			})
			if (!res.ok) {
				const body = (await res.json().catch(() => ({}))) as { error?: string }
				throw new Error(body.error || 'Accès refusé')
			}
			router.replace(nextAfter)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Une erreur est survenue')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle>Connexion Admin</CardTitle>
				<CardDescription>Entrez le mot de passe pour accéder à l&apos;administration.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="password">Mot de passe</Label>
						<Input
							id="password"
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••"
						/>
						{error && <p className="text-sm text-red-500">{error}</p>}
					</div>
					<Button type="submit" className="w-full" disabled={loading || !password}>
						{loading ? 'Connexion…' : 'Se connecter'}
					</Button>
				</form>
			</CardContent>
		</Card>
	)
}

export default function AdminLoginPage() {
	return (
		<main className="min-h-screen bg-axone-dark flex items-center justify-center px-6">
			<Suspense fallback={<Card className="w-full max-w-md"><CardContent className="pt-6"><p className="text-center">Chargement…</p></CardContent></Card>}>
				<AdminLoginForm />
			</Suspense>
		</main>
	)
}


