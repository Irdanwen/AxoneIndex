import { isAddress } from 'viem'
import type { Address } from 'viem'

export interface VaultOnchainConfig {
	chainId: number
	vaultAddress: `0x${string}`
	handlerAddress: `0x${string}`
	l1ReadAddress: `0x${string}`
	usdcAddress: `0x${string}`
	coreTokenIds: {
		usdc: number
		hype: number
		btc: number
	}
}

export interface VaultUiMetadata {
	id: string
	slug: string
	displayName: string
	description?: string
	risk: 'low' | 'medium' | 'high'
	status: 'open' | 'closed' | 'paused'
	iconUrl?: string
	tags?: string[]
}

export interface VaultDefinition extends VaultOnchainConfig, VaultUiMetadata {}

export type NewVaultInput = Omit<VaultDefinition, 'id' | 'slug'>
export type UpdateVaultInput = Partial<Omit<VaultDefinition, 'id' | 'slug'>> & {
	// Sécurité: interdire la mise à jour de l'id/slug depuis l'extérieur
	id?: never
	slug?: never
}

export function isVaultOnchainConfig(value: unknown): value is VaultOnchainConfig {
	if (!value || typeof value !== 'object') return false
	const v = value as Partial<VaultOnchainConfig>
	const coreTokenIds = v.coreTokenIds as Partial<VaultOnchainConfig['coreTokenIds']> | undefined
	return (
		typeof v.chainId === 'number' &&
		coreTokenIds !== undefined &&
		coreTokenIds !== null &&
		typeof coreTokenIds === 'object' &&
		typeof coreTokenIds.usdc === 'number' &&
		typeof coreTokenIds.hype === 'number' &&
		typeof coreTokenIds.btc === 'number' &&
		typeof v.vaultAddress === 'string' &&
		typeof v.handlerAddress === 'string' &&
		typeof v.l1ReadAddress === 'string' &&
		typeof v.usdcAddress === 'string' &&
		isAddress(v.vaultAddress as Address) &&
		isAddress(v.handlerAddress as Address) &&
		isAddress(v.l1ReadAddress as Address) &&
		isAddress(v.usdcAddress as Address)
	)
}

export function isVaultUiMetadata(value: unknown): value is VaultUiMetadata {
	if (!value || typeof value !== 'object') return false
	const v = value as Partial<VaultUiMetadata>
	const validRisk = v.risk === 'low' || v.risk === 'medium' || v.risk === 'high'
	const validStatus = v.status === 'open' || v.status === 'closed' || v.status === 'paused'
	const tagsOk = v.tags === undefined || (Array.isArray(v.tags) && v.tags.every(t => typeof t === 'string'))
	return (
		typeof v.id === 'string' &&
		typeof v.slug === 'string' &&
		typeof v.displayName === 'string' &&
		validRisk &&
		validStatus &&
		tagsOk &&
		(v.description === undefined || typeof v.description === 'string') &&
		(v.iconUrl === undefined || typeof v.iconUrl === 'string')
	)
}

export function isVaultDefinition(value: unknown): value is VaultDefinition {
	if (!value || typeof value !== 'object') return false
	const v = value as Partial<VaultDefinition>
	return isVaultUiMetadata(v) && isVaultOnchainConfig(v)
}

export function normaliseUiMetadata(input: Omit<VaultUiMetadata, 'id' | 'slug'> & { id?: string; slug?: string }): Omit<VaultUiMetadata, 'id' | 'slug'> {
	return {
		displayName: String(input.displayName || '').trim(),
		description: input.description?.trim() || undefined,
		risk: input.risk,
		status: input.status,
		iconUrl: input.iconUrl?.trim() || undefined,
		tags: input.tags?.map(t => t.trim()).filter(Boolean),
	}
}

export function normaliseOnchainConfig(input: VaultOnchainConfig): VaultOnchainConfig {
	return {
		chainId: input.chainId,
		vaultAddress: input.vaultAddress,
		handlerAddress: input.handlerAddress,
		l1ReadAddress: input.l1ReadAddress,
		usdcAddress: input.usdcAddress,
		coreTokenIds: {
			usdc: Number.isFinite(input.coreTokenIds.usdc) ? input.coreTokenIds.usdc : 0,
			hype: Number.isFinite(input.coreTokenIds.hype) ? input.coreTokenIds.hype : 0,
			btc: Number.isFinite(input.coreTokenIds.btc) ? input.coreTokenIds.btc : 0,
		},
	}
}

export function extractEraIndex(id: string): number | null {
	// Attendu: "Era-1", "Era-2", ...
	const m = /^Era-(\d+)$/.exec(id)
	if (!m) return null
	const n = Number(m[1])
	return Number.isFinite(n) ? n : null
}

export function buildEraId(n: number): string {
	return `Era-${n}`
}

export function buildEraSlug(n: number): string {
	return `era-${n}`
}


