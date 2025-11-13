'use client'

import { useMemo, useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContracts, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Label } from '@/components/ui'
import { Wallet, Loader2 } from 'lucide-react'
import { useVaultBySlug } from '@/hooks/useVaultBySlug'
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

const PX_DECIMALS = { hype: 8 } as const

function toBigint(value: unknown): bigint | undefined {
	return typeof value === 'bigint' ? value : undefined
}

function toNumber(value: unknown): number | undefined {
	return typeof value === 'number' ? value : undefined
}

export default function VaultBySlugPage() {
	const params = useParams<{ slug: string }>()
	const slug = params?.slug
	const router = useRouter()
	const { vault, loading, error } = useVaultBySlug(slug)

	if (loading) {
		return <main className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></main>
	}
	if (error || !vault) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<p className="text-sm text-red-500 mb-2">{error || 'Vault introuvable'}</p>
					<Button onClick={() => router.push('/market')}>Retour au market</Button>
				</div>
			</main>
		)
	}
	return <VaultClient vault={vault} />
}

function VaultClient({ vault }: { vault: VaultDefinition }) {
	const { address, isConnected } = useAccount()
	const { writeContract, isPending, data: hash } = useWriteContract()
	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

	const [depositAmount, setDepositAmount] = useState('')
	const [withdrawAmount, setWithdrawAmount] = useState('')

	const { data: hypeNative } = useBalance({ address, query: { enabled: !!address } })

	const contracts = useMemo(() => ([
		{ ...vaultContract(vault.vaultAddress), functionName: 'balanceOf' as const, args: address ? [address] as const : undefined },
		{ ...vaultContract(vault.vaultAddress), functionName: 'decimals' as const },
		{ ...vaultContract(vault.vaultAddress), functionName: 'totalSupply' as const },
		{ ...vaultContract(vault.vaultAddress), functionName: 'pps1e18' as const },
		{ ...vaultContract(vault.vaultAddress), functionName: 'depositFeeBps' as const },
		{ ...vaultContract(vault.vaultAddress), functionName: 'withdrawFeeBps' as const },
		{ ...coreInteractionHandlerContract(vault.handlerAddress), functionName: 'oraclePxHype1e8' as const },
	]), [vault, address])

	const { data: contractData, refetch } = useReadContracts({
		contracts,
		query: { enabled: isConnected },
	})

	const decimalsResult = contractData?.[1]?.result
	const vaultDecimals = toNumber(decimalsResult) ?? 18
	const hypeBalance = formatUnitsSafe(hypeNative?.value, hypeNative?.decimals ?? 18)
	const vaultShares = formatUnitsSafe(toBigint(contractData?.[0]?.result), vaultDecimals)
	const vaultTotalSupply = formatUnitsSafe(toBigint(contractData?.[2]?.result), vaultDecimals)
	const pps = formatUnitsSafe(toBigint(contractData?.[3]?.result), 18)
	const depositFeeBps = toNumber(contractData?.[4]?.result) ?? 0
	const withdrawFeeBpsDefault = toNumber(contractData?.[5]?.result) ?? 0
	const oraclePxHype1e8Str = formatUnitsSafe(toBigint(contractData?.[6]?.result), PX_DECIMALS.hype)

	const ppsRaw = toBigint(contractData?.[3]?.result) ?? 0n
	const totalSupplyRaw = toBigint(contractData?.[2]?.result) ?? 0n
	const pxHype1e8Raw = toBigint(contractData?.[6]?.result) ?? 0n

	const { data: vaultCash } = useBalance({ address: vault.vaultAddress, query: { enabled: !!vault.vaultAddress } })
	const vaultCashHypeStr = formatUnitsSafe(vaultCash?.value, vaultCash?.decimals ?? 18)

	useEffect(() => {
		if (isSuccess) {
			refetch()
			setDepositAmount('')
			setWithdrawAmount('')
		}
	}, [isSuccess, refetch])

	const handleDeposit = () => {
		if (!depositAmount) return
		const value = parseUnits(depositAmount, hypeNative?.decimals ?? 18)
		writeContract({
			...vaultContract(vault.vaultAddress),
			functionName: 'deposit',
			args: [],
			value,
		})
	}
	const handleWithdraw = () => {
		if (!withdrawAmount) return
		const shares = parseUnits(withdrawAmount, vaultDecimals)
		writeContract({
			...vaultContract(vault.vaultAddress),
			functionName: 'withdraw',
			args: [shares],
		})
	}

	const depositEstimate = (() => {
		if (!depositAmount) return null
		let amount1e18: bigint
		try { amount1e18 = parseUnits(depositAmount, hypeNative?.decimals ?? 18) } catch { return null }
		if (amount1e18 <= 0n || pxHype1e8Raw === 0n) return null
		const ONE_E18 = 1000000000000000000n
		const scaleShares = 10n ** BigInt(vaultDecimals)
		const depositUsd1e18 = (amount1e18 * pxHype1e8Raw) / BigInt(10 ** PX_DECIMALS.hype)
		let sharesBeforeFeeRaw: bigint
		if (totalSupplyRaw === 0n || ppsRaw === 0n) {
			sharesBeforeFeeRaw = (depositUsd1e18 * scaleShares) / ONE_E18
		} else {
			sharesBeforeFeeRaw = (depositUsd1e18 * scaleShares) / ppsRaw
		}
		const feeBpsClamped = Math.min(Math.max(depositFeeBps, 0), 10000)
		const sharesAfterFeeRaw = (sharesBeforeFeeRaw * BigInt(10000 - feeBpsClamped)) / 10000n
		return {
			usdFormatted: formatUnitsSafe(depositUsd1e18, 18),
			sharesFormatted: formatUnitsSafe(sharesAfterFeeRaw, vaultDecimals),
		}
	})()

	const withdrawArgs = useMemo(() => {
		const sharesStr = withdrawAmount || '0'
		const shares = sharesStr ? parseUnits(sharesStr, vaultDecimals) : 0n
		if (shares <= 0n || ppsRaw === 0n || pxHype1e8Raw === 0n) return undefined
		const dueUsd1e18 = (shares * ppsRaw) / 1000000000000000000n
		const grossHype = (dueUsd1e18 * BigInt(10 ** PX_DECIMALS.hype)) / pxHype1e8Raw
		return [grossHype] as const
	}, [withdrawAmount, vaultDecimals, ppsRaw, pxHype1e8Raw])

	const { data: feeBpsForAmount } = useReadContract({
		...vaultContract(vault.vaultAddress),
		functionName: 'getWithdrawFeeBpsForAmount',
		args: withdrawArgs,
		query: { enabled: Boolean(vault?.vaultAddress && withdrawArgs) }
	})

	const withdrawEstimate = (() => {
		const sharesStr = withdrawAmount || '0'
		const shares = sharesStr ? parseUnits(sharesStr, vaultDecimals) : 0n
		if (shares <= 0n || ppsRaw === 0n || pxHype1e8Raw === 0n) return null
		const dueUsd1e18 = (shares * ppsRaw) / 1000000000000000000n
		const grossHype1e18 = (dueUsd1e18 * BigInt(10 ** PX_DECIMALS.hype)) / pxHype1e8Raw
		const appliedFeeBps = (typeof feeBpsForAmount === 'number' ? feeBpsForAmount : undefined) ?? withdrawFeeBpsDefault
		const fee = (grossHype1e18 * BigInt(appliedFeeBps)) / 10000n
		const net = grossHype1e18 - fee
		const cash = vaultCash?.value ?? 0n
		const likelyQueued = grossHype1e18 > cash
		return { grossHype1e18, netHype1e18: net, feeBps: appliedFeeBps, likelyQueued }
	})()

	if (!isConnected) {
		return (
			<div className="container mx-auto py-8">
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Wallet className="h-16 w-16 text-muted-foreground mb-4" />
						<h2 className="text-2xl font-semibold mb-2">Connectez votre wallet</h2>
						<p className="text-muted-foreground">Veuillez connecter votre wallet pour accéder à ce vault.</p>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<main className="min-h-screen hero-gradient">
			<div className="relative">
				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-vault-brand/5 to-transparent pointer-events-none" />
				<div className="relative z-10 container-custom py-8" style={{ paddingTop: '10rem' }}>
					<div className="mb-8 text-center w-full">
						<h1 className="text-3xl font-bold mb-1">{vault.displayName}</h1>
						<p className="text-vault-muted max-w-2xl mx-auto">{vault.description}</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-base">Parts du Vault</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{vaultShares}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-base">PPS (USD)</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{pps}</p></CardContent>
						</Card>
						<Card>
							<CardHeader className="pb-2"><CardTitle className="text-base">NAV (USD)</CardTitle></CardHeader>
							<CardContent><p className="text-2xl font-bold">{(() => {
								const ONE_E18 = 1000000000000000000n
								const nav1e18 = (ppsRaw * totalSupplyRaw) / ONE_E18
								return formatUnitsSafe(nav1e18, 18)
							})()}</p></CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
						<Card className="w-full">
							<CardHeader>
								<CardTitle>Déposer HYPE (natif)</CardTitle>
								<CardDescription>Déposez des HYPE dans le vault et recevez des parts.</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="depositAmount">Montant (HYPE)</Label>
										<Input id="depositAmount" type="number" step="0.0001" placeholder="0.0000" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={isPending || isConfirming} />
										<p className="text-sm text-muted-foreground">Balance: {hypeBalance} HYPE</p>
										{depositEstimate && (
											<div className="text-xs text-muted-foreground">
												<div>Prix HYPE estimé: ~{oraclePxHype1e8Str} USD</div>
												<div>Montant USD estimé: ~{depositEstimate.usdFormatted} USD</div>
												<div>Parts estimées nettes (après {depositFeeBps} bps): ~{depositEstimate.sharesFormatted}</div>
											</div>
										)}
									</div>
									<Button onClick={handleDeposit} disabled={!depositAmount || isPending || isConfirming || parseFloat(depositAmount || '0') <= 0 || parseFloat(depositAmount) > parseFloat(hypeBalance || '0')} className="w-full">
										{isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
										Déposer
									</Button>
									{parseFloat(depositAmount || '0') > parseFloat(hypeBalance || '0') && depositAmount && (
										<p className="text-sm text-red-500">Montant supérieur à votre balance HYPE</p>
									)}
								</div>
							</CardContent>
						</Card>
						<Card className="w-full">
							<CardHeader>
								<CardTitle>Retirer</CardTitle>
								<CardDescription>Échangez vos parts contre des HYPE.</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="withdrawAmount">Parts à retirer</Label>
										<Input id="withdrawAmount" type="number" step="0.000001" placeholder="0.000000" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} disabled={isPending || isConfirming} />
										<p className="text-sm text-muted-foreground">Parts disponibles : {vaultShares}</p>
										<div className="text-xs text-muted-foreground">
											<button type="button" className="underline" onClick={() => setWithdrawAmount(vaultShares || '0')} disabled={isPending || isConfirming}>Max</button>
										</div>
									</div>
									<Button onClick={handleWithdraw} disabled={!withdrawAmount || isPending || isConfirming || parseFloat(withdrawAmount) > parseFloat(vaultShares)} className="w-full">
										{isPending || isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
										Retirer
									</Button>
									{parseFloat(withdrawAmount) > parseFloat(vaultShares) && withdrawAmount && (
										<p className="text-sm text-red-500">Montant supérieur à vos parts disponibles</p>
									)}
									{withdrawEstimate && (
										<div className="text-xs text-muted-foreground space-y-1">
											<div>Frais estimés: {withdrawEstimate.feeBps} bps</div>
												<div>Montant brut (HYPE): ~{formatUnitsSafe(withdrawEstimate.grossHype1e18, 18)}</div>
												<div>Montant net (HYPE): ~{formatUnitsSafe(withdrawEstimate.netHype1e18, 18)}</div>
											<div>Trésorerie EVM: {vaultCashHypeStr} HYPE</div>
											{withdrawEstimate.likelyQueued ? (
												<div className="text-amber-500">Ce retrait pourrait être mis en file d’attente.</div>
											) : (
												<div className="text-green-500">Retrait probablement immédiat.</div>
											)}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card className="mt-6">
						<CardHeader><CardTitle>Informations</CardTitle></CardHeader>
						<CardContent>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total Supply</span>
									<span className="font-mono">{vaultTotalSupply}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Prix HYPE (oracle)</span>
									<span className="font-mono">{oraclePxHype1e8Str} USD</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Adresse du Vault</span>
									<span className="font-mono text-xs">{vault.vaultAddress}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</main>
	)
}


