import { NextResponse } from 'next/server'
import { addVault, readVaults, getVaultBySlug } from '@/server/vaultStore'
import type { NewVaultInput } from '@/types/vaults'

export const runtime = 'nodejs'

function isValidRisk(v: unknown): v is 'low' | 'medium' | 'high' {
	return v === 'low' || v === 'medium' || v === 'high'
}

function isValidStatus(v: unknown): v is 'open' | 'closed' | 'paused' {
	return v === 'open' || v === 'closed' || v === 'paused'
}

function parseNewVault(body: unknown): NewVaultInput {
	if (!body || typeof body !== 'object') throw new Error('Invalid payload')
	const v = body as Partial<NewVaultInput>
	if (
		typeof v.displayName !== 'string' ||
		!isValidRisk(v.risk) ||
		!isValidStatus(v.status) ||
		typeof v.chainId !== 'number' ||
		!v.coreTokenIds ||
		typeof v.coreTokenIds.usdc !== 'number' ||
		typeof v.coreTokenIds.hype !== 'number' ||
		typeof v.coreTokenIds.btc !== 'number' ||
		typeof v.vaultAddress !== 'string' ||
		typeof v.handlerAddress !== 'string' ||
		typeof v.l1ReadAddress !== 'string' ||
		typeof v.usdcAddress !== 'string'
	) {
		throw new Error('Invalid vault fields')
	}
	return {
		displayName: v.displayName.trim(),
		description: v.description?.trim(),
		risk: v.risk,
		status: v.status,
		iconUrl: v.iconUrl?.trim(),
		tags: Array.isArray(v.tags) ? v.tags.map(t => String(t).trim()).filter(Boolean) : undefined,
		chainId: v.chainId,
		vaultAddress: v.vaultAddress as `0x${string}`,
		handlerAddress: v.handlerAddress as `0x${string}`,
		l1ReadAddress: v.l1ReadAddress as `0x${string}`,
		usdcAddress: v.usdcAddress as `0x${string}`,
		coreTokenIds: v.coreTokenIds,
	}
}

export async function GET(req: Request) {
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

export async function POST(req: Request) {
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


