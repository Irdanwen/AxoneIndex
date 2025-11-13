'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui'
import { VaultForm } from '@/components/admin/VaultForm'

export default function AdminAddVaultPage() {
	const router = useRouter()
	const handleSuccess = () => {
		router.replace('/admin/vaults')
	}
	return (
		<main className="min-h-screen bg-axone-dark">
			<section className="mx-auto w-full max-w-3xl px-6 py-16">
				<Card>
					<CardHeader>
						<CardTitle>Ajouter un Vault</CardTitle>
						<CardDescription>Renseignez la configuration on-chain et les métadonnées d’affichage.</CardDescription>
					</CardHeader>
					<CardContent>
						<VaultForm onSuccess={handleSuccess} />
					</CardContent>
				</Card>
			</section>
		</main>
	)
}


