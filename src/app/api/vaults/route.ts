import { NextResponse, type NextRequest } from 'next/server'
import { addVault, readVaults, getVaultBySlug } from '@/server/vaultStore'
import { parseNewVault } from '@/pages/api/vaults'

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const slug = searchParams.get('slug')

		if (slug) {
			const v = await getVaultBySlug(slug)
			if (!v) {
				return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
			}
			return NextResponse.json(v, { status: 200 })
		}

		const list = await readVaults()
		return NextResponse.json(list, { status: 200 })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Internal server error'
		const status = message.includes('Invalid') ? 400 : 500
		return NextResponse.json({ error: message }, { status })
	}
}

export async function POST(req: NextRequest) {
	try {
		const json = (await req.json().catch(() => null)) as unknown
		const payload = parseNewVault(json)
		const created = await addVault(payload)
		return NextResponse.json(created, { status: 201 })
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Internal server error'
		const status = message.includes('Invalid') ? 400 : 500
		return NextResponse.json({ error: message }, { status })
	}
}


