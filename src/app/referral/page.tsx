'use client'

import { useState } from 'react'
import { useAccount, useConnect, useContractRead, useContractWrite, useChainId } from 'wagmi'
import { injected } from 'wagmi/connectors'
import GlassCard from '@/components/ui/GlassCard'
import { Button } from '@/components/ui'
import { getCodeHash, REFERRAL_REGISTRY_ADDRESS, HYPEREVM_CHAIN_ID } from '@/lib/referralUtils'
import ReferralRegistryABI from '@/lib/abi/ReferralRegistry.json'

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connect } = useConnect()

  // Vérifier si l'utilisateur est whitelisté
  const { data: isWhitelisted } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined,
  })

  // Fonction pour utiliser un code de parrainage
  const { writeContract, isPending: isUsingCode } = useContractWrite()
  
  const handleUseCode = () => {
    if (!referralCode.trim()) {
      setError('Veuillez entrer un code de parrainage')
      return
    }

    if (chainId !== HYPEREVM_CHAIN_ID) {
      setError('Veuillez vous connecter au réseau HyperEVM Testnet')
      return
    }

    try {
      const codeHash = getCodeHash(referralCode.trim())
      writeContract({
        address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
        abi: ReferralRegistryABI.abi,
        functionName: 'useCode',
        args: [codeHash],
      }, {
        onSuccess: () => {
          setSuccess('Code de parrainage utilisé avec succès ! Vous êtes maintenant whitelisté.')
          setError('')
          setReferralCode('')
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : String(error)
          let friendly = 'La transaction a échoué.'
          if (message.includes('User rejected')) friendly = 'Transaction rejetée par l’utilisateur.'
          if (message.includes('insufficient funds')) friendly = 'Fonds insuffisants pour les frais.'
          if (message.includes('chain mismatch') || message.includes('wrong network')) friendly = 'Mauvais réseau, passez sur HyperEVM.'
          setError(friendly)
          setSuccess('')
        }
      })
    } catch {
      setError('Erreur lors du hashage du code')
    }
  }



  const handleConnect = () => {
    connect({ connector: injected() })
  }

  const handleGoToApp = () => {
    window.location.href = '/referral-management'
  }

  // Si l'utilisateur n'est pas connecté
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
        <div className="container-custom">
          <GlassCard className="w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-white-pure mb-6">Connexion Requise</h1>
          <p className="text-white-75 mb-8">
            Connectez votre wallet pour accéder au système de parrainage
          </p>
          <Button onClick={handleConnect} className="w-full">
            Connecter Wallet
          </Button>
        </GlassCard>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas sur le bon réseau
  if (chainId !== HYPEREVM_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
        <div className="container-custom">
          <GlassCard className="w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-white-pure mb-6">Réseau Incorrect</h1>
          <p className="text-white-75 mb-8">
            Veuillez vous connecter au réseau HyperEVM Testnet pour continuer
          </p>
          <p className="text-sm text-white-60 mb-4">
            Réseau actuel: {chainId === 1 ? 'Ethereum Mainnet' : chainId === 998 ? 'HyperEVM Testnet' : `Chain ID: ${chainId}`}
          </p>
        </GlassCard>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est déjà whitelisté
  if (isWhitelisted) {
    return (
      <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
        <div className="container-custom">
          <GlassCard className="w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-white-pure mb-6">Accès Autorisé</h1>
          <p className="text-white-75 mb-8">
            Vous êtes déjà whitelisté ! Vous pouvez maintenant gérer vos parrainages.
          </p>
          <Button onClick={handleGoToApp} className="w-full">
            Gérer mes parrainages
          </Button>
        </GlassCard>
        </div>
      </div>
    )
  }

  // Formulaire de saisie du code de parrainage
  return (
    <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
      <div className="container-custom">
        <GlassCard className="w-full p-8">
        <h1 className="text-3xl font-bold text-white-pure mb-6 text-center">
          Code de Parrainage
        </h1>
        
        <div className="[&>*+*]:mt-6">
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-white-75 mb-2">
              Code de parrainage
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Entrez votre code de parrainage"
              className="w-full px-4 py-3 border border-white/10 rounded-lg focus:ring-2 focus:ring-axone-accent focus:border-transparent bg-axone-dark-light text-white-pure placeholder-white-60"
              disabled={isUsingCode}
            />
          </div>

          {error && (
            <div className="p-4 bg-error/20 border border-error rounded-lg">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-success/20 border border-success rounded-lg">
              <p className="text-success text-sm">{success}</p>
            </div>
          )}

          <Button 
            onClick={handleUseCode}
            disabled={isUsingCode || !referralCode.trim()}
            className="w-full"
          >
            {isUsingCode ? 'Validation...' : 'Valider le Code'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-white-60">
              Adresse connectée: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>
      </GlassCard>
      </div>
    </div>
  )
}
