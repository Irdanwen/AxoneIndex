import { promises as fs } from 'fs'
import path from 'path'
import {
	type NewVaultInput,
	type UpdateVaultInput,
	type VaultDefinition,
	isVaultDefinition,
	normaliseOnchainConfig,
	normaliseUiMetadata,
	buildEraId,
	buildEraSlug,
	extractEraIndex,
} from '@/types/vaults'

const DATA_FILE = path.join(process.cwd(), 'data', 'vaults.json')

async function ensureDataFile(): Promise<void> {
	await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
	try {
		await fs.access(DATA_FILE)
	} catch {
		await fs.writeFile(DATA_FILE, '[]\n', 'utf-8')
	}
}

export async function readVaults(): Promise<VaultDefinition[]> {
	await ensureDataFile()
	const raw = await fs.readFile(DATA_FILE, 'utf-8')
	try {
		const parsed = JSON.parse(raw) as unknown
		if (!Array.isArray(parsed)) return []
		const cleaned = parsed.filter(isVaultDefinition) as VaultDefinition[]
		// tri par index d'ère croissant si possible, sinon par id
		return cleaned.slice().sort((a, b) => {
			const ai = extractEraIndex(a.id)
			const bi = extractEraIndex(b.id)
			if (ai !== null && bi !== null) return ai - bi
			return a.id.localeCompare(b.id)
		})
	} catch {
		return []
	}
}

async function writeVaults(vaults: VaultDefinition[]): Promise<void> {
	await ensureDataFile()
	const payload = JSON.stringify(vaults, null, 2)
	await fs.writeFile(DATA_FILE, `${payload}\n`, 'utf-8')
}

function nextEraIndex(existing: VaultDefinition[]): number {
	let max = 0
	for (const v of existing) {
		const idx = extractEraIndex(v.id)
		if (idx && idx > max) max = idx
	}
	return max + 1
}

export async function getVaultById(id: string): Promise<VaultDefinition | undefined> {
	const all = await readVaults()
	return all.find(v => v.id === id)
}

export async function getVaultBySlug(slug: string): Promise<VaultDefinition | undefined> {
	const all = await readVaults()
	return all.find(v => v.slug === slug)
}

export async function addVault(input: NewVaultInput): Promise<VaultDefinition> {
	const all = await readVaults()
	const index = nextEraIndex(all)
	const id = buildEraId(index)
	const slug = buildEraSlug(index)

	const onchain = normaliseOnchainConfig({
		chainId: input.chainId,
		vaultAddress: input.vaultAddress,
		handlerAddress: input.handlerAddress,
		l1ReadAddress: input.l1ReadAddress,
		usdcAddress: input.usdcAddress,
		coreTokenIds: input.coreTokenIds,
	})
	const ui = normaliseUiMetadata({
		displayName: input.displayName,
		description: input.description,
		risk: input.risk,
		status: input.status,
		iconUrl: input.iconUrl,
		tags: input.tags,
	})

	const created: VaultDefinition = {
		id,
		slug,
		displayName: ui.displayName,
		description: ui.description,
		risk: ui.risk,
		status: ui.status,
		iconUrl: ui.iconUrl,
		tags: ui.tags,
		chainId: onchain.chainId,
		vaultAddress: onchain.vaultAddress,
		handlerAddress: onchain.handlerAddress,
		l1ReadAddress: onchain.l1ReadAddress,
		usdcAddress: onchain.usdcAddress,
		coreTokenIds: onchain.coreTokenIds,
	}

	const updated = [...all, created]
	await writeVaults(updated)
	return created
}

export async function updateVault(id: string, changes: UpdateVaultInput): Promise<VaultDefinition> {
	const all = await readVaults()
	const index = all.findIndex(v => v.id === id)
	if (index < 0) {
		throw new Error('Vault not found')
	}

	const current = all[index]
	const merged: VaultDefinition = {
		...current,
		// UI
		displayName: typeof changes.displayName === 'string' ? changes.displayName.trim() : current.displayName,
		description: changes.description !== undefined ? changes.description?.trim() : current.description,
		risk: changes.risk ?? current.risk,
		status: changes.status ?? current.status,
		iconUrl: changes.iconUrl !== undefined ? changes.iconUrl?.trim() : current.iconUrl,
		tags: changes.tags !== undefined ? changes.tags.map(t => t.trim()).filter(Boolean) : current.tags,
		// On-chain
		chainId: changes.chainId ?? current.chainId,
		vaultAddress: changes.vaultAddress ?? current.vaultAddress,
		handlerAddress: changes.handlerAddress ?? current.handlerAddress,
		l1ReadAddress: changes.l1ReadAddress ?? current.l1ReadAddress,
		usdcAddress: changes.usdcAddress ?? current.usdcAddress,
		coreTokenIds: changes.coreTokenIds
			? {
				usdc: Number.isFinite(changes.coreTokenIds.usdc) ? changes.coreTokenIds.usdc : current.coreTokenIds.usdc,
				hype: Number.isFinite(changes.coreTokenIds.hype) ? changes.coreTokenIds.hype : current.coreTokenIds.hype,
				btc: Number.isFinite(changes.coreTokenIds.btc) ? changes.coreTokenIds.btc : current.coreTokenIds.btc,
			}
			: current.coreTokenIds,
	}

	all[index] = merged
	await writeVaults(all)
	return merged
}

export async function deleteVault(id: string): Promise<void> {
	const all = await readVaults()
	const updated = all.filter(v => v.id !== id)
	await writeVaults(updated)
}


