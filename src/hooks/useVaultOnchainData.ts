'use client'

import { useMemo } from 'react'
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi'
import type { VaultDefinition } from '@/types/vaults'
import { vaultContract } from '@/contracts/vault'
import { coreInteractionHandlerContract } from '@/contracts/coreInteractionHandler'
import { formatUnits, zeroAddress } from 'viem'

function formatUnitsSafe(value: bigint | undefined, decimals: number): string {
	if (value === undefined) return '0'
	try {
		return formatUnits(value, decimals)
	} catch {
		return '0'
	}
}

function toBigint(value: unknown): bigint | undefined {
	return typeof value === 'bigint' ? value : undefined
}

function toNumber(value: unknown): number | undefined {
	return typeof value === 'number' ? value : undefined
}

export function useVaultOnchainData(vault: VaultDefinition | undefined) {
	const { address, isConnected } = useAccount()

	const contracts = useMemo(() => {
		if (!vault) return []
		return [
			{ ...vaultContract(vault.vaultAddress), functionName: 'decimals' as const },
			{ ...vaultContract(vault.vaultAddress), functionName: 'totalSupply' as const },
			{ ...vaultContract(vault.vaultAddress), functionName: 'pps1e18' as const },
			{ ...vaultContract(vault.vaultAddress), functionName: 'depositFeeBps' as const },
			{ ...vaultContract(vault.vaultAddress), functionName: 'withdrawFeeBps' as const },
			{ ...coreInteractionHandlerContract(vault.handlerAddress), functionName: 'oraclePxHype1e8' as const },
		]
	}, [vault])

	const { data: multi } = useReadContracts({
		contracts,
		query: { enabled: !!vault },
	})

	const decimals = toNumber(multi?.[0]?.result) ?? 18
	const totalSupplyRaw = toBigint(multi?.[1]?.result) ?? 0n
	const pps1e18Raw = toBigint(multi?.[2]?.result) ?? 0n
	const depositFeeBps = toNumber(multi?.[3]?.result) ?? 0
	const withdrawFeeBps = toNumber(multi?.[4]?.result) ?? 0
	const oraclePxHype1e8Raw = toBigint(multi?.[5]?.result) ?? 0n

	const totalSupply = formatUnitsSafe(totalSupplyRaw, decimals)
	const pps = formatUnitsSafe(pps1e18Raw, 18)
	const oraclePxHype1e8Str = formatUnitsSafe(oraclePxHype1e8Raw, 8)

	const { data: vaultCash } = useBalance({ address: vault?.vaultAddress, query: { enabled: !!vault?.vaultAddress } })
	const vaultCashHype = formatUnitsSafe(vaultCash?.value, vaultCash?.decimals ?? 18)

	const safeVaultAddress = vault?.vaultAddress ?? zeroAddress
	const { data: userSharesRes } = useReadContract({
		...vaultContract(safeVaultAddress),
		functionName: 'balanceOf',
		args: address ? [address] : undefined,
		query: { enabled: !!vault && !!address && isConnected },
	})
	const userShares = formatUnitsSafe(toBigint(userSharesRes), decimals)

	const navUsd = useMemo(() => {
		if (pps1e18Raw === 0n || totalSupplyRaw === 0n) return '0'
		const ONE_E18 = 1000000000000000000n
		const nav1e18 = (pps1e18Raw * totalSupplyRaw) / ONE_E18
		return formatUnitsSafe(nav1e18, 18)
	}, [pps1e18Raw, totalSupplyRaw])

	return {
		decimals,
		totalSupply,
		totalSupplyRaw,
		pps,
		pps1e18Raw,
		depositFeeBps,
		withdrawFeeBps,
		oraclePxHype1e8Str,
		oraclePxHype1e8Raw,
		userShares,
		vaultCashHype,
		navUsd,
	}
}


