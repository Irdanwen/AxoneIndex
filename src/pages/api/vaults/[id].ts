import type { NextApiRequest, NextApiResponse } from 'next'
import { deleteVault, getVaultById, updateVault } from '@/server/vaultStore'
import type { UpdateVaultInput } from '@/types/vaults'

function isValidRisk(v: unknown): v is 'low' | 'medium' | 'high' {
	return v === 'low' || v === 'medium' || v === 'high'
}
function isValidStatus(v: unknown): v is 'open' | 'closed' | 'paused' {
	return v === 'open' || v === 'closed' || v === 'paused'
}

function parseUpdate(body: unknown): UpdateVaultInput {
	if (!body || typeof body !== 'object') throw new Error('Invalid payload')
	const v = body as Partial<UpdateVaultInput>
	const out: UpdateVaultInput = {}
	if (v.displayName !== undefined) {
		if (typeof v.displayName !== 'string') throw new Error('displayName invalid')
		out.displayName = v.displayName.trim()
	}
	if (v.description !== undefined) {
		if (typeof v.description !== 'string') throw new Error('description invalid')
		out.description = v.description.trim()
	}
	if (v.iconUrl !== undefined) {
		if (typeof v.iconUrl !== 'string') throw new Error('iconUrl invalid')
		out.iconUrl = v.iconUrl.trim()
	}
	if (v.tags !== undefined) {
		if (!Array.isArray(v.tags)) throw new Error('tags invalid')
		out.tags = v.tags.map(t => String(t).trim()).filter(Boolean)
	}
	if (v.risk !== undefined) {
		if (!isValidRisk(v.risk)) throw new Error('risk invalid')
		out.risk = v.risk
	}
	if (v.status !== undefined) {
		if (!isValidStatus(v.status)) throw new Error('status invalid')
		out.status = v.status
	}
	if (v.chainId !== undefined) {
		if (typeof v.chainId !== 'number') throw new Error('chainId invalid')
		out.chainId = v.chainId
	}
	if (v.vaultAddress !== undefined) out.vaultAddress = v.vaultAddress as any
	if (v.handlerAddress !== undefined) out.handlerAddress = v.handlerAddress as any
	if (v.l1ReadAddress !== undefined) out.l1ReadAddress = v.l1ReadAddress as any
	if (v.usdcAddress !== undefined) out.usdcAddress = v.usdcAddress as any
	if (v.coreTokenIds !== undefined) {
		if (
			typeof v.coreTokenIds !== 'object' ||
			v.coreTokenIds === null ||
			typeof (v.coreTokenIds as any).usdc !== 'number' ||
			typeof (v.coreTokenIds as any).hype !== 'number' ||
			typeof (v.coreTokenIds as any).btc !== 'number'
		) {
			throw new Error('coreTokenIds invalid')
		}
		out.coreTokenIds = v.coreTokenIds
	}
	return out
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	try {
		const { id } = req.query
		if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid id' })

		if (req.method === 'GET') {
			const v = await getVaultById(id)
			if (!v) return res.status(404).json({ error: 'Vault not found' })
			return res.status(200).json(v)
		}
		if (req.method === 'PUT') {
			const payload = parseUpdate(req.body as unknown)
			const updated = await updateVault(id, payload)
			return res.status(200).json(updated)
		}
		if (req.method === 'DELETE') {
			await deleteVault(id)
			return res.status(204).end()
		}

		res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
		return res.status(405).end('Method Not Allowed')
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Internal server error'
		const status = message.includes('Invalid') ? 400 : 500
		return res.status(status).json({ error: message })
	}
}


