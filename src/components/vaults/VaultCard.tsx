'use client'

import { useMemo, useState } from 'react'
import { Vault } from '@/lib/vaultTypes'
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from 'wagmi/actions'
import { config } from '@/lib/wagmi'
import { parseUnits, formatUnits } from 'viem'
import { erc20Abi } from '@/lib/abi/erc20'
import { vaultContractAbi } from '@/lib/abi/VaultContract'

interface VaultCardProps {
  vault: Vault
  onDeposit?: () => void
  onWithdraw?: () => void
  onInfo?: () => void
}

export function VaultCard({ vault, onDeposit, onWithdraw, onInfo }: VaultCardProps) {
  const isPositive = vault.performance30d >= 0
  const hasDeposit = vault.userDeposit > 0
  const { address: userAddress } = useAccount()
  const [depositAmount, setDepositAmount] = useState<string>('')
  const [withdrawAmount, setWithdrawAmount] = useState<string>('')

  const vaultAddress = vault.contractAddress as `0x${string}` | undefined
  const usdcAddress = vault.usdcAddress as `0x${string}` | undefined

  const { data: pps } = useReadContract({
    abi: vaultContractAbi,
    address: vaultAddress,
    functionName: 'pps1e18',
    query: { enabled: Boolean(vaultAddress) }
  })

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

  const canInteract = useMemo(() => Boolean(vaultAddress && usdcAddress), [vaultAddress, usdcAddress])

  const handleDepositInternal = async () => {
    if (!canInteract || !userAddress) return
    try {
      const amount1e6 = parseUnits(depositAmount || '0', 6)
      if (amount1e6 <= 0n) return
      // Approve USDC
      const approveHash = await writeContractAsync({
        abi: erc20Abi,
        address: usdcAddress!,
        functionName: 'approve',
        args: [vaultAddress!, amount1e6]
      })
      await waitForTransactionReceipt(config, { hash: approveHash })
      // Deposit amount in 1e6
      await writeContractAsync({
        abi: vaultContractAbi,
        address: vaultAddress!,
        functionName: 'deposit',
        args: [amount1e6]
      })
      setDepositAmount('')
    } catch (e) {
      // noop: erreurs visibles dans wallet/console
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
    } catch (e) {
      // noop
    }
  }
  
  // Risk colors
  const riskColors = {
    low: 'text-green-400 bg-green-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10', 
    high: 'text-red-400 bg-red-400/10'
  }
  
  const riskIcons = {
    low: <Shield className="w-3.5 h-3.5" />,
    medium: <AlertTriangle className="w-3.5 h-3.5" />,
    high: <Activity className="w-3.5 h-3.5" />
  }
  
  // Status styles
  const statusStyles = {
    open: 'bg-green-400/10 text-green-400',
    paused: 'bg-yellow-400/10 text-yellow-400',
    closed: 'bg-red-400/10 text-red-400'
  }
  
  const statusLabels = {
    open: 'Actif',
    paused: 'En pause',
    closed: 'Fermé'
  }

  return (
    <div className="bg-vault-card border border-vault rounded-xl overflow-hidden hover-vault-card group h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-vault" style={{ padding: '1rem' }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="text-lg font-semibold text-vault-primary truncate">
            {vault.name}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[vault.status]}`}>
              {statusLabels[vault.status]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${riskColors[vault.risk]}`}>
              {riskIcons[vault.risk]}
              {vault.risk === 'low' ? 'Faible' : vault.risk === 'medium' ? 'Moyen' : 'Élevé'}
            </span>
          </div>
        </div>

        {/* Token composition */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1 flex-shrink-0">
            {vault.tokens.slice(0, 4).map((token, i) => (
              <div 
                key={i} 
                className="w-6 h-6 rounded-full bg-vault-muted border border-vault flex items-center justify-center text-xs font-medium text-vault-muted"
                style={{ zIndex: vault.tokens.length - i }}
              >
                {token.symbol.slice(0, 2)}
              </div>
            ))}
          </div>
          <span className="text-xs text-vault-dim truncate">
            {vault.tokens.map(t => `${t.symbol} ${t.percentage}%`).join(' • ')}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 flex-1 flex flex-col" style={{ padding: '1rem' }}>
        {/* TVL */}
        <div className="flex items-center gap-2">
          <p className="text-xs text-vault-muted">TVL:</p>
          <p className="text-xl font-bold text-vault-primary">
            ${vault.tvl.toLocaleString('fr-FR')}
          </p>
        </div>

        {/* Performance */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-vault-muted/30">
          <div className="flex items-center gap-2">
            <p className="text-xs text-vault-muted">Performance 30j:</p>
            <span className={`text-lg font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{vault.performance30d.toFixed(2)}%
            </span>
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
          </div>
          {isPositive ? (
            <ArrowUpRight className="w-5 h-5 text-green-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-red-400" />
          )}
        </div>

        {/* User deposit if exists */}
        {hasDeposit && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-vault-brand-muted border border-vault-brand/20">
            <p className="text-xs text-vault-brand">Mon dépôt:</p>
            <p className="text-lg font-semibold text-vault-brand">
              ${vault.userDeposit.toLocaleString('fr-FR')} USDC
            </p>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1" />

        {/* Inputs d'action */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Montant à déposer (USDC)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Montant à retirer (shares)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="dark:bg-gray-800 dark:text-white"
            />
            <div className="mt-1 text-[11px] text-vault-dim flex items-center gap-2">
              <span>Max: {formatUnits(((userShares as bigint) || 0n), 18)}</span>
              <button
                type="button"
                className="underline"
                onClick={() => setWithdrawAmount(formatUnits(((userShares as bigint) || 0n), 18))}
              >
                Tout
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onDeposit ? onDeposit : handleDepositInternal}
            className="flex-1 px-4 py-2.5 bg-vault-brand hover:bg-vault-brand/90 text-black font-medium rounded-lg transition-colors"
            disabled={vault.status === 'closed' || !canInteract || isBusy}
          >
            Déposer
          </button>
          <button
            onClick={onWithdraw ? onWithdraw : handleWithdrawInternal}
            className="flex-1 px-4 py-2.5 bg-vault-muted hover:bg-vault-muted/80 text-vault-primary font-medium rounded-lg transition-colors"
            disabled={!canInteract || isBusy}
          >
            Retirer
          </button>
          <button
            onClick={onInfo}
            className="px-3 py-2.5 bg-vault-muted hover:bg-vault-muted/80 text-vault-primary rounded-lg transition-colors"
            aria-label="Plus d'informations"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
        {!canInteract && (
          <div className="text-xs text-vault-dim">Renseignez les adresses dans la gestion du vault pour activer les actions.</div>
        )}
      </div>
    </div>
  )
}
