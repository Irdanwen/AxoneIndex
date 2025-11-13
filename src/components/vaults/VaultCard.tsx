'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity,
  AlertTriangle,
  Info,
  Shield,
  TrendingDown,
  TrendingUp,
  X
} from 'lucide-react'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi'
import { formatUnits, parseUnits } from 'viem'

import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { vaultContractAbi } from '@/lib/abi/VaultContract'
import type { VaultDefinition } from '@/types/vaults'

type VaultListItem = VaultDefinition & {
  tokens?: { symbol: string; percentage?: number }[]
  tvlUsd?: number
  userDepositUsd?: number
  performance30d?: number
}

interface VaultCardSummaryProps {
  vault: VaultListItem
  onDeposit?: () => void
  onWithdraw?: () => void
  onInfo?: () => void
}

interface VaultCardActionsProps {
  vault: VaultListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeposit?: () => void
  onWithdraw?: () => void
}

const statusConfig = {
  open: { label: 'Actif', tone: 'bg-green-400/10 text-green-400' },
  paused: { label: 'En pause', tone: 'bg-yellow-400/10 text-yellow-400' },
  closed: { label: 'Fermé', tone: 'bg-red-400/10 text-red-400' }
} as const

const riskConfig = {
  low: { label: 'Faible', Icon: Shield },
  medium: { label: 'Moyen', Icon: AlertTriangle },
  high: { label: 'Élevé', Icon: Activity }
} as const

export function VaultCardSummary({
  vault,
  onDeposit,
  onWithdraw,
  onInfo
}: VaultCardSummaryProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false)
  const performance = vault.performance30d ?? 0
  const isPositive = performance >= 0
  const userDeposit = vault.userDepositUsd ?? 0
  const hasDeposit = userDeposit > 0
  const RiskIcon = riskConfig[vault.risk].Icon
  const composition = vault.tokens?.length
    ? vault.tokens.map(token => `${token.symbol}${typeof token.percentage === 'number' ? ` ${token.percentage}%` : ''}`).join(' • ')
    : vault.tags?.join(' • ')
  const tvl = vault.tvlUsd ?? 0

  return (
    <>
      <Card className="hover-vault-card vault-surface border border-vault shadow-vault-sm h-full max-w-md mx-auto">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-vault-primary">
              {vault.displayName}
            </CardTitle>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig[vault.status].tone}`}
              >
                {statusConfig[vault.status].label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-vault px-2 py-1 text-xs font-medium text-vault-muted">
                <RiskIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {riskConfig[vault.risk].label}
              </span>
            </div>
          </div>

          {composition && (
            <p className="mt-3 text-sm text-vault-muted">
              {composition}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-vault-muted">TVL</span>
            <span className="text-2xl font-semibold text-vault-primary">
              {tvl > 0 ? `$${tvl.toLocaleString('fr-FR')}` : '–'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg vault-surface-alt px-4 py-3">
            <div>
              <p className="text-sm text-vault-muted">Performance 30 jours</p>
              <p
                className={`text-lg font-semibold ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {performance.toFixed(2)}%
              </p>
            </div>
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-green-400" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-400" aria-hidden="true" />
            )}
          </div>

          {hasDeposit && (
            <div className="rounded-lg border border-vault bg-vault-brand-muted px-4 py-3">
              <p className="text-xs text-vault-muted">Mon dépôt</p>
              <p className="text-sm font-semibold text-vault-primary">
                ${userDeposit.toLocaleString('fr-FR')} USDC
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center gap-3 border-t border-vault p-6 pt-4">
          <button
            type="button"
            onClick={() => setIsActionsOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-vault bg-vault-muted px-4 py-2 text-sm font-medium text-vault-primary transition-colors hover:border-vault-strong"
          >
            Gérer
          </button>
          <button
            type="button"
            onClick={onInfo}
            className="inline-flex items-center justify-center rounded-lg border border-vault px-3 py-2 text-sm text-vault-muted transition-colors hover:border-vault-strong hover:text-vault-primary"
            aria-label="Plus d'informations"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
          </button>
        </CardFooter>
      </Card>

      <VaultCardActions
        vault={vault}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
        onDeposit={onDeposit}
        onWithdraw={onWithdraw}
      />
    </>
  )
}

export function VaultCardActions({
  vault,
  open,
  onOpenChange,
  onDeposit,
  onWithdraw
}: VaultCardActionsProps) {
  const { address: userAddress } = useAccount()
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  const vaultAddress = vault.vaultAddress as `0x${string}` | undefined

  const { data: userShares } = useReadContract({
    abi: vaultContractAbi,
    address: vaultAddress,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: Boolean(vaultAddress && userAddress) }
  })

  const { writeContractAsync, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash })
  const isBusy = isPending || isConfirming
  const canInteract = useMemo(() => Boolean(vaultAddress), [vaultAddress])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const { style } = document.body
    const previousOverflow = style.overflow
    style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      style.overflow = previousOverflow
    }
  }, [open, onOpenChange])

  const handleDepositInternal = async () => {
    if (!canInteract || !userAddress) return
    try {
      const value = parseUnits(depositAmount || '0', 18)
      if (value <= 0n) return
      await writeContractAsync({
        abi: vaultContractAbi,
        address: vaultAddress!,
        functionName: 'deposit',
        args: [],
        value
      })
      setDepositAmount('')
    } catch {
      // Erreurs gérées par le wallet
    }
  }

  const handleWithdrawInternal = async () => {
    if (!canInteract || !userAddress) return
    try {
      const enteredShares = parseUnits(withdrawAmount || '0', 18)
      if (enteredShares <= 0n) return
      const maxShares = (userShares as bigint) || 0n
      const sharesToBurn = enteredShares > maxShares ? maxShares : enteredShares
      if (sharesToBurn <= 0n) return
      await writeContractAsync({
        abi: vaultContractAbi,
        address: vaultAddress!,
        functionName: 'withdraw',
        args: [sharesToBurn]
      })
      setWithdrawAmount('')
    } catch {
      // Erreurs gérées par le wallet
    }
  }

  if (!isMounted || !open) {
    return null
  }

  const formattedShares = formatUnits(((userShares as bigint) || 0n), 18)

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-6 md:items-center">
      <div
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      <Card
        className="relative z-10 w-full max-w-lg vault-surface border border-vault shadow-vault-sm"
        role="dialog"
        aria-modal="true"
        aria-label={`Actions pour ${vault.displayName}`}
      >
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-vault-primary">
              Gérer {vault.displayName}
            </CardTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-vault p-2 text-vault-muted transition-colors hover:border-vault-strong hover:text-vault-primary"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-sm text-vault-muted">
            Effectuez vos dépôts et retraits directement depuis cette interface.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-vault-primary" htmlFor={`deposit-${vault.id}`}>
              Dépôt
            </label>
            <Input
              id={`deposit-${vault.id}`}
              type="number"
              min="0"
              placeholder="Montant à déposer (HYPE)"
              value={depositAmount}
              onChange={event => setDepositAmount(event.target.value)}
            />
            <p className="text-xs text-vault-dim">
              Disponible uniquement si l&apos;adresse du contrat est renseignée.
            </p>
            <button
              type="button"
              onClick={onDeposit ? onDeposit : handleDepositInternal}
              className="inline-flex w-full items-center justify-center rounded-lg bg-vault-brand px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-vault-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={vault.status === 'closed' || !canInteract || isBusy}
            >
              Déposer
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-vault-primary" htmlFor={`withdraw-${vault.id}`}>
              Retrait
            </label>
            <Input
              id={`withdraw-${vault.id}`}
              type="number"
              min="0"
              placeholder="Montant à retirer (shares)"
              value={withdrawAmount}
              onChange={event => setWithdrawAmount(event.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-vault-dim">
              <span>Max: {formattedShares}</span>
              <button
                type="button"
                className="text-vault-muted underline-offset-2 hover:underline"
                onClick={() => setWithdrawAmount(formattedShares)}
              >
                Tout retirer
              </button>
            </div>
            <button
              type="button"
              onClick={onWithdraw ? onWithdraw : handleWithdrawInternal}
              className="inline-flex w-full items-center justify-center rounded-lg border border-vault px-4 py-2 text-sm font-semibold text-vault-primary transition-colors hover:border-vault-strong disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canInteract || isBusy}
            >
              Retirer
            </button>
          </div>

          {!canInteract && (
            <p className="text-xs text-vault-dim">
              Renseignez l&apos;adresse du smart contract pour activer les actions on-chain.
            </p>
          )}
        </CardContent>
      </Card>
    </div>,
    document.body
  )
}

export { VaultCardSummary as VaultCard }
