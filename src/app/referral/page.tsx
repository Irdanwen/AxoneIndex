'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useContractRead, useContractWrite, useNetwork } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/Button'
import { getCodeHash, REFERRAL_REGISTRY_ADDRESS, SEPOLIA_CHAIN_ID } from '@/lib/referralUtils'
import ReferralRegistryABI from '@/lib/abi/ReferralRegistry.json'

export default function ReferralPage() {
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { address, isConnected } = useAccount()
  const { chain } = useNetwork()
  const { connect, connectors } = useConnect()

  // Vérifier si l'utilisateur est whitelisté
  const { data: isWhitelisted, isLoading: isCheckingWhitelist } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'isWhitelisted',
    args: [address],
    enabled: !!address && chain?.id === SEPOLIA_CHAIN_ID,
  })

  // Fonction pour utiliser un code de parrainage
  const { write: useCode, isPending: isUsingCode } = useContractWrite({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'useCode',
    onSuccess: () => {
      setSuccess('Code de parrainage utilisé avec succès ! Vous êtes maintenant whitelisté.')
      setError('')
      setReferralCode('')
    },
    onError: (err) => {
      setError(`Erreur: ${err.message}`)
      setSuccess('')
    }
  })

  const handleUseCode = () => {
    if (!referralCode.trim()) {
      setError('Veuillez entrer un code de parrainage')
      return
    }

    if (chain?.id !== SEPOLIA_CHAIN_ID) {
      setError('Veuillez vous connecter au réseau Sepolia')
      return
    }

    try {
      const codeHash = getCodeHash(referralCode.trim())
      useCode({ args: [codeHash] })
    } catch (err) {
      setError('Erreur lors du hashage du code')
    }
  }

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] })
    }
  }

  const handleGoToApp = () => {
    window.open('https://google.com', '_blank')
  }

  // Si l'utilisateur n'est pas connecté
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Connexion Requise</h1>
          <p className="text-gray-600 mb-8">
            Connectez votre wallet pour accéder au système de parrainage
          </p>
          <Button onClick={handleConnect} className="w-full">
            Connecter Wallet
          </Button>
        </GlassCard>
      </div>
    )
  }

  // Si l'utilisateur n'est pas sur le bon réseau
  if (chain?.id !== SEPOLIA_CHAIN_ID) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Réseau Incorrect</h1>
          <p className="text-gray-600 mb-8">
            Veuillez vous connecter au réseau Sepolia pour continuer
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Réseau actuel: {chain?.name || 'Inconnu'}
          </p>
        </GlassCard>
      </div>
    )
  }

  // Si l'utilisateur est déjà whitelisté
  if (isWhitelisted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <GlassCard className="max-w-md w-full p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Accès Autorisé</h1>
          <p className="text-gray-600 mb-8">
            Vous êtes déjà whitelisté ! Vous pouvez accéder à l'application.
          </p>
          <Button onClick={handleGoToApp} className="w-full">
            Go App
          </Button>
        </GlassCard>
      </div>
    )
  }

  // Formulaire de saisie du code de parrainage
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Code de Parrainage
        </h1>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
              Code de parrainage
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              placeholder="Entrez votre code de parrainage"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isUsingCode}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{success}</p>
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
            <p className="text-sm text-gray-500">
              Adresse connectée: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
