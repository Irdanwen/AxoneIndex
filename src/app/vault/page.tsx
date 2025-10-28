'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContract } from 'wagmi'
import { parseUnits } from 'viem'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { vaultContract } from '@/contracts/vault'
import { coreInteractionHandlerContract } from '@/contracts/coreInteractionHandler'
import { formatNumber, formatUnitsSafe } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui'
import { AlertCircle, Loader2, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

// Conversions décimales HYPE 1e18 ↔ prix oracle 1e8
// oraclePxHype1e8() renvoie un prix USD en 1e8 (ex: 50 USD => 500000000)
// Conversion vers USD 1e18: usd1e18 = (hype1e18 * px1e8) / 1e8
// Conversion inverse: hype1e18 = (usd1e18 * 1e8) / px1e8
const PX_DECIMALS = {
  hype: 8,  // HYPE prix normalisé en 1e8 (ex: 500000000 = 50 USD)
} as const

export default function VaultPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { config, isConfigured } = useVaultConfig()
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  // Solde natif HYPE (1e18)
  const { data: hypeNative } = useBalance({
    address,
    query: { enabled: !!address },
  })

  // Lire les infos du vault (shares, decimals, totalSupply, PPS, fees) et oracle HYPE
  const contracts = config && address ? [
    // Vault shares balance
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'balanceOf',
      args: [address],
    },
    // Vault decimals
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'decimals',
    },
    // Vault totalSupply
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'totalSupply',
    },
    // PPS (USD 1e18)
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'pps1e18',
    },
    // depositFeeBps
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'depositFeeBps',
    },
    // withdrawFeeBps (par défaut)
    {
      ...vaultContract(config.vaultAddress),
      functionName: 'withdrawFeeBps',
    },
    // Oracle HYPE 1e8 via handler
    {
      ...coreInteractionHandlerContract(config.handlerAddress),
      functionName: 'oraclePxHype1e8',
    },
  ] : []

  const { data: contractData, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: isConfigured && isConnected,
    },
  })

  // Formater les données
  const hypeBalance = formatUnitsSafe(hypeNative?.value as bigint | undefined, hypeNative?.decimals ?? 18)
  const vaultShares = formatUnitsSafe(contractData?.[0]?.result as bigint, (contractData?.[1]?.result as number) || 18)
  const vaultDecimals = (contractData?.[1]?.result as number) || 18
  const vaultTotalSupply = formatUnitsSafe(contractData?.[2]?.result as bigint, vaultDecimals)
  const pps = formatUnitsSafe(contractData?.[3]?.result as bigint, 18)
  const depositFeeBps = (contractData?.[4]?.result as number) || 0
  const withdrawFeeBpsDefault = (contractData?.[5]?.result as number) || 0
  // CORRECTION: Utiliser pxDecimals normalisé HYPE (1e8) car oraclePxHype1e8() normalise déjà
  const oraclePxHype1e8Str = formatUnitsSafe(contractData?.[6]?.result as bigint, PX_DECIMALS.hype)

  // Valeurs brutes utiles pour calculs
  const ppsRaw = (contractData?.[3]?.result as bigint) || 0n
  const totalSupplyRaw = (contractData?.[2]?.result as bigint) || 0n
  const pxHype1e8Raw = (contractData?.[6]?.result as bigint) || 0n

  // Balance HYPE du contrat Vault (trésorerie EVM)
  const { data: vaultCash } = useBalance({ address: (config?.vaultAddress as `0x${string}` | undefined), query: { enabled: !!config?.vaultAddress } })
  const vaultCashHypeStr = formatUnitsSafe(vaultCash?.value as bigint | undefined, vaultCash?.decimals ?? 18)

  // Rafraîchir après une transaction réussie
  useEffect(() => {
    if (isSuccess) {
      refetch()
      setDepositAmount('')
      setWithdrawAmount('')
      toast({
        title: "Transaction réussie",
        description: "L'opération a été effectuée avec succès.",
      })
    }
  }, [isSuccess, refetch, toast])

  const handleDeposit = () => {
    if (!config || !depositAmount) return

    // Le vault HYPE50 utilise deposit() payable en HYPE natif (1e18)
    const value = parseUnits(depositAmount, hypeNative?.decimals ?? 18)
    try {
      writeContract({
        ...vaultContract(config.vaultAddress),
        functionName: 'deposit',
        args: [],
        value,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      let description = 'La transaction a échoué.'
      if (message.includes('User rejected')) description = 'Transaction rejetée par l\'utilisateur.'
      if (message.includes('insufficient funds')) description = 'Fonds insuffisants pour les frais.'
      if (message.includes('chain mismatch') || message.includes('wrong network')) description = 'Mauvais réseau, passez sur HyperEVM.'
      toast({ title: 'Échec du dépôt', description })
    }
  }

  const handleWithdraw = () => {
    if (!config || !withdrawAmount) return

    // Le vault utilise withdraw(uint256 shares)
    const shares = parseUnits(withdrawAmount, vaultDecimals)
    try {
      writeContract({
        ...vaultContract(config.vaultAddress),
        functionName: 'withdraw',
        args: [shares],
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      let description = 'La transaction a échoué.'
      if (message.includes('User rejected')) description = 'Transaction rejetée par l\'utilisateur.'
      if (message.includes('insufficient funds')) description = 'Fonds insuffisants pour les frais.'
      if (message.includes('chain mismatch') || message.includes('wrong network')) description = 'Mauvais réseau, passez sur HyperEVM.'
      toast({ title: 'Échec du retrait', description })
    }
  }

  // Estimation dépôt: shares attendues
  const depositEstimate = (() => {
    if (!depositAmount) return null

    let amount1e18: bigint
    try {
      amount1e18 = parseUnits(depositAmount, hypeNative?.decimals ?? 18)
    } catch {
      return null
    }

    if (amount1e18 <= 0n || pxHype1e8Raw === 0n) return null

    const ONE_E18 = 1000000000000000000n
    const scaleShares = 10n ** BigInt(vaultDecimals)

    // CORRECTION: Utiliser le facteur de conversion basé sur pxDecimals HYPE normalisé (1e8)
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

  // Estimation retrait: net HYPE et risque de file (en fonction de la trésorerie EVM)
  // Calcul grossHype1e18 pour intéroger le fee tier (si dispo)
  const withdrawGrossHype1e18ForFee: bigint | undefined = (() => {
    const sharesStr = withdrawAmount || '0'
    const shares = sharesStr ? parseUnits(sharesStr, vaultDecimals) : 0n
    if (shares <= 0n || ppsRaw === 0n || pxHype1e8Raw === 0n) return undefined
    const dueUsd1e18 = (shares * ppsRaw) / 1000000000000000000n
    // CORRECTION: Utiliser le facteur de conversion basé sur pxDecimals HYPE normalisé (1e8)
    const grossHype = (dueUsd1e18 * BigInt(10 ** PX_DECIMALS.hype)) / pxHype1e8Raw
    return grossHype
  })()

  const { data: feeBpsForAmount } = useReadContract({
    ...vaultContract((config?.vaultAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`),
    functionName: 'getWithdrawFeeBpsForAmount',
    args: withdrawGrossHype1e18ForFee ? [withdrawGrossHype1e18ForFee] : undefined,
    query: { enabled: Boolean(config?.vaultAddress && withdrawGrossHype1e18ForFee !== undefined) }
  })

  const withdrawEstimate = (() => {
    const sharesStr = withdrawAmount || '0'
    const shares = sharesStr ? parseUnits(sharesStr, vaultDecimals) : 0n
    if (shares <= 0n || ppsRaw === 0n || pxHype1e8Raw === 0n) return null
    const dueUsd1e18 = (shares * ppsRaw) / 1000000000000000000n
    // CORRECTION: Utiliser le facteur de conversion basé sur pxDecimals HYPE normalisé (1e8)
    const grossHype1e18 = (dueUsd1e18 * BigInt(10 ** PX_DECIMALS.hype)) / pxHype1e8Raw
    const appliedFeeBps = (feeBpsForAmount as number | undefined) ?? withdrawFeeBpsDefault
    const fee = (grossHype1e18 * BigInt(appliedFeeBps)) / 10000n
    const net = grossHype1e18 - fee
    const cash = (vaultCash?.value as bigint | undefined) ?? 0n
    const likelyQueued = grossHype1e18 > cash
    return {
      grossHype1e18,
      netHype1e18: net,
      feeBps: appliedFeeBps,
      likelyQueued,
    }
  })()

  // Si pas de wallet connecté
  if (!isConnected) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Connectez votre wallet</h2>
            <p className="text-muted-foreground">Veuillez connecter votre wallet pour accéder au vault</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Si configuration manquante
  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Configuration requise</h2>
            <p className="text-muted-foreground mb-6">
              Veuillez configurer les adresses dans Admin Vaults
            </p>
            <Link href="/admin/vaults">
              <Button>Aller à Admin Vaults</Button>
            </Link>
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
        <h1 className="text-3xl font-bold mb-2">Gestion du Vault</h1>
        <p className="text-vault-muted max-w-2xl mx-auto">
          Approuvez, déposez et retirez vos fonds du vault
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Balance HYPE (native)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(hypeBalance, { decimals: 4 })}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parts du Vault</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(vaultShares, { decimals: 6 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Deposit */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Déposer HYPE (natif)</CardTitle>
            <CardDescription>
              Déposez des HYPE dans le vault et recevez des parts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Montant à déposer (HYPE)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.0001"
                  placeholder="0.0000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                />
                <p className="text-sm text-muted-foreground">Balance disponible : {formatNumber(hypeBalance, { decimals: 4 })} HYPE</p>
              {depositEstimate && (
                <div className="text-xs text-muted-foreground">
                  <div>Prix HYPE estimé: ~{formatNumber(oraclePxHype1e8Str, { decimals: 2 })} USD</div>
                  <div>Montant USD estimé: ~{formatNumber(depositEstimate.usdFormatted, { decimals: 2 })} USD</div>
                  <div>Parts estimées nettes (après frais {depositFeeBps} bps): ~{formatNumber(depositEstimate.sharesFormatted, { decimals: 6 })}</div>
                </div>
              )}
              </div>
              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || isPending || isConfirming || parseFloat(depositAmount || '0') <= 0 || parseFloat(depositAmount) > parseFloat(hypeBalance || '0')}
                className="w-full"
              >
                {isPending || isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Déposer
              </Button>
              {parseFloat(depositAmount || '0') > parseFloat(hypeBalance || '0') && depositAmount && (
                <p className="text-sm text-red-500">
                  Montant supérieur à votre balance HYPE
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Retirer du Vault</CardTitle>
            <CardDescription>
              Échangez vos parts contre des HYPE
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Montant de parts à retirer</Label>
                <Input
                  id="withdrawAmount"
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                />
                <p className="text-sm text-muted-foreground">
                  Parts disponibles : {formatNumber(vaultShares, { decimals: 6 })}
                </p>
                <div className="text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setWithdrawAmount(vaultShares || '0')}
                    disabled={isPending || isConfirming}
                  >
                    Max
                  </button>
                </div>
              </div>
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isPending || isConfirming || parseFloat(withdrawAmount) > parseFloat(vaultShares)}
                className="w-full"
              >
                {isPending || isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Retirer
              </Button>
              {parseFloat(withdrawAmount) > parseFloat(vaultShares) && withdrawAmount && (
                <p className="text-sm text-red-500">
                  Montant supérieur à vos parts disponibles
                </p>
              )}
              {withdrawEstimate && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Frais de retrait estimés: {withdrawEstimate.feeBps} bps</div>
                  <div>Montant brut (HYPE): ~{formatNumber(formatUnitsSafe(withdrawEstimate.grossHype1e18, 18), { decimals: 4 })}</div>
                  <div>Montant net (HYPE): ~{formatNumber(formatUnitsSafe(withdrawEstimate.netHype1e18, 18), { decimals: 4 })}</div>
                  <div>Trésorerie EVM du vault: {formatNumber(vaultCashHypeStr, { decimals: 4 })} HYPE</div>
                  {withdrawEstimate.likelyQueued ? (
                    <div className="text-amber-500">Ce retrait pourrait être mis en file d&apos;attente (rappel Core nécessaire).</div>
                  ) : (
                    <div className="text-green-500">Retrait probablement payable immédiatement.</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informations du Vault</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Supply du Vault</span>
              <span className="font-mono">{formatNumber(vaultTotalSupply, { decimals: 2, compact: true })}</span>
            </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PPS (USD)</span>
            <span className="font-mono">{formatNumber(pps, { decimals: 4 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">NAV (USD)</span>
            <span className="font-mono">{
              (() => {
                const ONE_E18 = 1000000000000000000n
                const nav1e18 = (ppsRaw * totalSupplyRaw) / ONE_E18
                const navUsd = formatUnitsSafe(nav1e18, 18)
                return formatNumber(navUsd, { decimals: 2, compact: true })
              })()
            }</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prix HYPE (oracle)</span>
            <span className="font-mono">{formatNumber(oraclePxHype1e8Str, { decimals: 2 })} USD</span>
          </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse du Vault</span>
              <span className="font-mono text-xs">{config?.vaultAddress}</span>
            </div>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </main>
  )
}