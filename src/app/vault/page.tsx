'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { erc20Contract } from '@/contracts/erc20'
import { vaultContract } from '@/contracts/vault'
import { formatNumber, formatUnitsSafe } from '@/lib/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, Wallet } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'

export default function VaultPage() {
  const { toast } = useToast()
  const { address, isConnected } = useAccount()
  const { config, isConfigured } = useVaultConfig()
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [approveAmount, setApproveAmount] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  // Lire les balances et allowance
  const contracts = config && address ? [
    // USDC balance
    {
      ...erc20Contract(config.usdcAddress),
      functionName: 'balanceOf',
      args: [address],
    },
    // USDC decimals
    {
      ...erc20Contract(config.usdcAddress),
      functionName: 'decimals',
    },
    // USDC allowance
    {
      ...erc20Contract(config.usdcAddress),
      functionName: 'allowance',
      args: [address, config.vaultAddress],
    },
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
  ] : []

  const { data: contractData, refetch } = useReadContracts({
    contracts,
    enabled: isConfigured && isConnected,
  })

  // Formater les données
  const usdcBalance = formatUnitsSafe(contractData?.[0]?.result as bigint, 6)
  const usdcDecimals = (contractData?.[1]?.result as number) || 6
  const allowance = formatUnitsSafe(contractData?.[2]?.result as bigint, usdcDecimals)
  const vaultShares = formatUnitsSafe(contractData?.[3]?.result as bigint, (contractData?.[4]?.result as number) || 18)
  const vaultDecimals = (contractData?.[4]?.result as number) || 18
  const vaultTotalSupply = formatUnitsSafe(contractData?.[5]?.result as bigint, vaultDecimals)

  // Rafraîchir après une transaction réussie
  useEffect(() => {
    if (isSuccess) {
      refetch()
      setApproveAmount('')
      setDepositAmount('')
      setWithdrawAmount('')
      toast({
        title: "Transaction réussie",
        description: "L'opération a été effectuée avec succès.",
      })
    }
  }, [isSuccess, refetch, toast])

  // Fonctions pour les transactions
  const handleApprove = () => {
    if (!config || !approveAmount) return

    const amount = parseUnits(approveAmount, usdcDecimals)
    writeContract({
      ...erc20Contract(config.usdcAddress),
      functionName: 'approve',
      args: [config.vaultAddress, amount],
    })
  }

  const handleDeposit = () => {
    if (!config || !depositAmount) return

    // Le vault utilise deposit(uint64 amount1e6)
    const amount = parseUnits(depositAmount, 6)
    writeContract({
      ...vaultContract(config.vaultAddress),
      functionName: 'deposit',
      args: [amount],
    })
  }

  const handleWithdraw = () => {
    if (!config || !withdrawAmount) return

    // Le vault utilise withdraw(uint256 shares)
    const shares = parseUnits(withdrawAmount, vaultDecimals)
    writeContract({
      ...vaultContract(config.vaultAddress),
      functionName: 'withdraw',
      args: [shares],
    })
  }

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
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestion du Vault</h1>
        <p className="text-muted-foreground">
          Approuvez, déposez et retirez vos fonds du vault
        </p>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Balance USDC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(usdcBalance, { decimals: 2 })}</p>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Allowance USDC</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumber(allowance, { decimals: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid gap-6">
        {/* Approve */}
        <Card>
          <CardHeader>
            <CardTitle>Approuver USDC</CardTitle>
            <CardDescription>
              Autorisez le vault à utiliser vos USDC
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approveAmount">Montant à approuver (USDC)</Label>
                <Input
                  id="approveAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={approveAmount}
                  onChange={(e) => setApproveAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                />
              </div>
              <Button
                onClick={handleApprove}
                disabled={!approveAmount || isPending || isConfirming}
                className="w-full"
              >
                {isPending || isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Approuver
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deposit */}
        <Card>
          <CardHeader>
            <CardTitle>Déposer USDC</CardTitle>
            <CardDescription>
              Déposez vos USDC dans le vault et recevez des parts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Montant à déposer (USDC)</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isPending || isConfirming}
                />
                <p className="text-sm text-muted-foreground">
                  Allowance actuelle : {formatNumber(allowance, { decimals: 2 })} USDC
                </p>
              </div>
              <Button
                onClick={handleDeposit}
                disabled={!depositAmount || isPending || isConfirming || parseFloat(depositAmount) > parseFloat(allowance)}
                className="w-full"
              >
                {isPending || isConfirming ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Déposer
              </Button>
              {parseFloat(depositAmount) > parseFloat(allowance) && depositAmount && (
                <p className="text-sm text-red-500">
                  Veuillez d'abord approuver un montant suffisant
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card>
          <CardHeader>
            <CardTitle>Retirer du Vault</CardTitle>
            <CardDescription>
              Échangez vos parts contre des USDC
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
              <span className="text-muted-foreground">Adresse du Vault</span>
              <span className="font-mono text-xs">{config?.vaultAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adresse USDC</span>
              <span className="font-mono text-xs">{config?.usdcAddress}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}