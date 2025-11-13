'use client'

import { useMemo } from 'react'
import { useAccount, useBalance, useReadContract, useReadContracts } from 'wagmi'
import type { VaultDefinition } from '@/types/vaults'
import { vaultContract } from '@/contracts/vault'
import { coreInteractionHandlerContract } from '@/contracts/coreInteractionHandler'
import { formatUnits } from 'viem'

function formatUnitsSafe(value: bigint | undefined, decimals: number): string {
	if (value === undefined) return '0'
	try {
		return formatUnits(value, decimals)
	} catch {
		return '0'
	}
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

	const decimals = (multi?.[0]?.result as number | undefined) ?? 18
	const totalSupplyRaw = (multi?.[1]?.result as bigint | undefined) ?? 0n
	const pps1e18Raw = (multi?.[2]?.result as bigint | undefined) ?? 0n
	const depositFeeBps = (multi?.[3]?.result as number | undefined) ?? 0
	const withdrawFeeBps = (multi?.[4]?.result as number | undefined) ?? 0
	const oraclePxHype1e8Raw = (multi?.[5]?.result as bigint | undefined) ?? 0n

	const totalSupply = formatUnitsSafe(totalSupplyRaw, decimals)
	const pps = formatUnitsSafe(pps1e18Raw, 18)
	const oraclePxHype1e8Str = formatUnitsSafe(oraclePxHype1e8Raw, 8)

	const { data: vaultCash } = useBalance({ address: (vault?.vaultAddress as any), query: { enabled: !!vault?.vaultAddress } })
	const vaultCashHype = formatUnitsSafe(vaultCash?.value as any, vaultCash?.decimals ?? 18)

	const { data: userSharesRes } = useReadContract({
		...vaultContract((vault?.vaultAddress || '0x0000000000000000000000000000000000000000') as any),
		functionName: 'balanceOf',
		args: address ? [address] : undefined,
		query: { enabled: !!vault && !!address && isConnected },
	})
	const userShares = formatUnitsSafe(userSharesRes as any, decimals)

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


