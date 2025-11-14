import type { NextApiRequest, NextApiResponse } from 'next'
import { addVault, readVaults, getVaultBySlug, isReadOnlyStorageError } from '@/server/vaultStore'
import type { NewVaultInput } from '@/types/vaults'

const READ_ONLY_SIMULATION = process.env.VAULT_STORAGE_SIMULATE_READONLY === '1'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
                if (req.method === 'GET') {
                        const { slug } = req.query
                        if (typeof slug === 'string' && slug) {
                                const v = await getVaultBySlug(slug)
                                if (!v) return res.status(404).json({ error: 'Vault not found' })
                                return res.status(200).json(v)
                        }
                        try {
                                const list = await readVaults()
                                if (READ_ONLY_SIMULATION) {
                                        console.info(
                                                `[api/vaults] GET /api/vaults returned ${list.length} entries while read-only filesystem simulation is active`,
                                        )
                                }
                                return res.status(200).json(list)
                        } catch (error) {
                                if (isReadOnlyStorageError(error)) {
                                        console.warn(
                                                `[api/vaults] GET /api/vaults served empty payload because storage is read-only (${error.code ?? 'UNKNOWN'})`,
                                        )
                                        return res.status(200).json([])
                                }
                                throw error
                        }
                }
		if (req.method === 'POST') {
			const payload = parseNewVault(req.body as unknown)
			const created = await addVault(payload)
			return res.status(201).json(created)
		}
		res.setHeader('Allow', ['GET', 'POST'])
		return res.status(405).end('Method Not Allowed')
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Internal server error'
		const status = message.includes('Invalid') ? 400 : 500
		return res.status(status).json({ error: message })
	}
}


