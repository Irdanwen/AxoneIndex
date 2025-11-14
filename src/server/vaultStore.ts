import { promises as fs } from 'fs'
import path from 'path'
import type { VercelKV } from '@vercel/kv'
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
const STORAGE_BACKEND = (process.env.VAULT_STORAGE_BACKEND ?? 'filesystem').toLowerCase()
const KV_KEY = process.env.VAULT_STORAGE_KV_KEY ?? 'axone:vaults'
const SIMULATE_READONLY = process.env.VAULT_STORAGE_SIMULATE_READONLY === '1'

export class VaultStorageError extends Error {
        constructor(
                message: string,
                public readonly code?: string,
        ) {
                super(message)
                this.name = 'VaultStorageError'
        }
}

export function isReadOnlyStorageError(error: unknown): error is VaultStorageError {
        return error instanceof VaultStorageError && (error.code === 'EACCES' || error.code === 'EROFS')
}

interface VaultStorageBackend {
        readRaw(): Promise<string | null>
        writeRaw(payload: string): Promise<void>
}

function createFilesystemBackend(): VaultStorageBackend {
        async function readRaw(): Promise<string | null> {
                try {
                        return await fs.readFile(DATA_FILE, 'utf-8')
                } catch (error) {
                        const err = error as NodeJS.ErrnoException
                        if (err?.code === 'ENOENT') {
                                return null
                        }
                        if (err?.code === 'EACCES' || err?.code === 'EROFS') {
                                throw new VaultStorageError('Vault data file is not readable', err.code)
                        }
                        throw error
                }
        }

        async function writeRaw(payload: string): Promise<void> {
                if (SIMULATE_READONLY) {
                        const simulated = new VaultStorageError('Simulated read-only filesystem', 'EROFS')
                        throw simulated
                }
                try {
                        await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
                        await fs.writeFile(DATA_FILE, payload, 'utf-8')
                } catch (error) {
                        const err = error as NodeJS.ErrnoException
                        if (err?.code === 'EACCES' || err?.code === 'EROFS') {
                                throw new VaultStorageError('Vault data file is not writable', err.code)
                        }
                        throw error
                }
        }

        return { readRaw, writeRaw }
}

let kvClientPromise: Promise<VercelKV> | null = null
async function resolveKvClient(): Promise<VercelKV> {
        if (!kvClientPromise) {
                kvClientPromise = import('@vercel/kv').then(mod => mod.kv)
        }
        return kvClientPromise
}

function createVercelKvBackend(): VaultStorageBackend {
        async function readRaw(): Promise<string | null> {
                try {
                        const client = await resolveKvClient()
                        const stored = await client.get<string | Record<string, unknown>>(KV_KEY)
                        if (stored === null || stored === undefined) return null
                        if (typeof stored === 'string') return stored
                        return JSON.stringify(stored)
                } catch {
                        throw new VaultStorageError('Unable to read vault definitions from KV', 'KV_READ')
                }
        }

        async function writeRaw(payload: string): Promise<void> {
                try {
                        const client = await resolveKvClient()
                        await client.set(KV_KEY, payload)
                } catch {
                        throw new VaultStorageError('Unable to persist vault definitions to KV', 'KV_WRITE')
                }
        }

        return { readRaw, writeRaw }
}

const backend: VaultStorageBackend = STORAGE_BACKEND === 'kv' || STORAGE_BACKEND === 'vercel-kv'
        ? createVercelKvBackend()
        : createFilesystemBackend()

export async function readVaults(): Promise<VaultDefinition[]> {
        const raw = await backend.readRaw()
        if (!raw) return []
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

async function persistVaults(vaults: VaultDefinition[]): Promise<void> {
        const payload = `${JSON.stringify(vaults, null, 2)}\n`
        await backend.writeRaw(payload)
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
        await persistVaults(updated)
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
        await persistVaults(all)
	return merged
}

export async function deleteVault(id: string): Promise<void> {
        const all = await readVaults()
        const updated = all.filter(v => v.id !== id)
        await persistVaults(updated)
}


