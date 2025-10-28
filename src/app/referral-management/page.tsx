'use client'

import { useState } from 'react'
import { useAccount, useContractRead, useContractWrite, useChainId } from 'wagmi'
import { REFERRAL_REGISTRY_ADDRESS, HYPEREVM_CHAIN_ID } from '@/lib/referralUtils'
import ReferralRegistryABI from '@/lib/abi/ReferralRegistry.json'
import GlassCard from '@/components/ui/GlassCard'
import { Button } from '@/components/ui'
import Stat from '@/components/ui/Stat'
import { motion } from 'framer-motion'
import Footer from '@/components/layout/Footer'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isReferralProtectedRoute } from '@/lib/referralRoutesConfig'

export default function ReferralManagement() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const pathname = usePathname()
  const isProtectedRoute = isReferralProtectedRoute(pathname || '')

  // Vérification d'accès - vérifier si l'utilisateur a un parrain via referrerOf
  const { data: referrer, isLoading: isLoadingAccess } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'referrerOf',
    args: address ? [address] : undefined
  })

  // Vérification du statut whitelisté
  const { data: isWhitelisted } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'isWhitelisted',
    args: address ? [address] : undefined
  })

  const hasReferrer = referrer && referrer !== '0x0000000000000000000000000000000000000000'

  // Récupération des données du contrat
  // Note: getReferralCount n'existe pas dans le contrat, on utilise codesCreated comme alternative
  const { data: referralCount, refetch: refetchReferralCount } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'codesCreated',
    args: address ? [address] : undefined
  })

  const { data: unusedCodes, refetch: refetchUnusedCodes } = useContractRead({
    address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
    abi: ReferralRegistryABI.abi,
    functionName: 'getUnusedCodes',
    args: address ? [address] : undefined
  })

  // Fonctionnalités d'interaction
  const { writeContract, isPending: isCreatingCodePending } = useContractWrite()

  // Gestionnaires d'actions
  const handleCreateCode = () => {
    console.log('handleCreateCode appelé')
    console.log('isConnected:', isConnected)
    console.log('chainId:', chainId)
    console.log('HYPEREVM_CHAIN_ID:', HYPEREVM_CHAIN_ID)
    console.log('address:', address)
    console.log('isWhitelisted:', isWhitelisted)
    console.log('hasReferrer:', hasReferrer)

    console.log('isCreatingCodePending:', isCreatingCodePending)
    
    if (!isConnected) {
      setError('Veuillez vous connecter à votre wallet')
      return
    }

    if (chainId !== HYPEREVM_CHAIN_ID) {
      setError('Veuillez vous connecter au réseau HyperEVM Testnet')
      return
    }

    if (!isWhitelisted) {
      setError('Vous devez être whitelisté pour créer des codes de parrainage')
      return
    }

    if (!hasReferrer) {
      setError('Vous devez avoir un parrain pour créer des codes de parrainage')
      return
    }



    if (isCreatingCodePending) {
      console.log('Transaction en cours...')
      return
    }

    console.log('Appel de writeContract pour createCode()...')
    try {
      writeContract({
        address: REFERRAL_REGISTRY_ADDRESS as `0x${string}`,
        abi: ReferralRegistryABI.abi,
        functionName: 'createCode',
        args: [], // Version sans arguments qui génère automatiquement un code
      }, {
        onSuccess: () => {
          console.log('Code créé avec succès')
          setSuccess('Code de parrainage créé avec succès !')
          setError('')
          setIsLoading(true)
          // Rafraîchir les données après un délai
          setTimeout(() => {
            setIsLoading(false)
            refetchUnusedCodes()
            refetchReferralCount()
          }, 2000)
        },
        onError: (error) => {
          console.error('Erreur création code:', error)
          setError(`Erreur lors de la création: ${error.message}`)
          setSuccess('')
        }
      })
    } catch (error) {
      console.error('Erreur lors de l\'appel writeContract:', error)
      setError(`Erreur lors de l'appel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  // === 🔒 Protection centralisée ===
  if (isProtectedRoute) {
    // Si l'utilisateur n'est pas connecté
    if (!isConnected) {
      return (
        <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
          <div className="container-custom">
            <GlassCard className="w-full p-8 text-center">
              <h1 className="text-3xl font-bold text-white-pure mb-6">Connexion Requise</h1>
              <p className="text-white-75 mb-8">
                Connectez votre wallet pour accéder à la gestion de vos parrainages
              </p>
              <Button className="w-full">
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

    // Vérification d'accès
    if (isLoadingAccess) {
      return (
        <div className="min-h-screen bg-axone-dark flex items-center justify-center">
          <div className="text-white-pure text-xl">Vérification de l&apos;accès...</div>
        </div>
      )
    }

    if (!isWhitelisted || !hasReferrer) {
      return (
        <div className="min-h-screen bg-axone-dark flex items-center justify-center p-4">
          <div className="container-custom">
            <GlassCard className="w-full p-8 text-center">
              <h2 className="text-2xl font-bold text-error mb-4">Accès refusé</h2>
              <p className="text-white-75 mb-6">
                {!isWhitelisted 
                  ? "Vous devez être whitelisté pour accéder à cette page" 
                  : "Vous devez avoir un parrain pour accéder à cette page"
                }
              </p>
              <Button asChild className="w-full">
                <Link href="/referral">
                  Utiliser un code de parrainage
                </Link>
              </Button>
            </GlassCard>
          </div>
        </div>
      )
    }
  }
  // === 🔒 Fin de la protection ===

  return (
    <>
      <main className="min-h-screen bg-axone-dark pt-24">
      {/* Section Hero avec tous les éléments */}
      <section className="hero-gradient min-h-screen flex items-center relative overflow-hidden">
        <div className="container-custom relative z-10">
          <div className="text-center space-y-12">
            {/* Titre et sous-titre */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hero-title font-black max-w-4xl mx-auto mb-8"
            >
              <span className="text-white-pure">Gestion de vos Parrainages</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white-85 font-medium leading-relaxed text-xl text-center mx-auto mb-12"
              style={{ maxWidth: '75rem' }}
            >
              Créez, suivez et gérez vos codes de parrainage
            </motion.p>

            {/* Statistiques */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid md:grid-cols-3 gap-8"
            >
              <Stat 
                label="Codes créés" 
                value={Number(referralCount?.toString() || '0')}
                className="text-center"
              />
              <Stat 
                label="Codes disponibles" 
                value={Array.isArray(unusedCodes) ? unusedCodes.length : 0}
                className="text-center"
              />
              <Stat 
                label="Quota maximum" 
                value={5}
                className="text-center"
              />
            </motion.div>

            {/* Création de code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <GlassCard className="mx-auto p-6 text-center" style={{ maxWidth: '50rem' }}>
                <h3 className="text-xl font-bold text-white-pure mb-4">Générer un nouveau code</h3>
                <Button
                  onClick={handleCreateCode}
                  disabled={isCreatingCodePending || isLoading}
                  className="bg-gradient-primary text-white-pure py-3 rounded-lg font-bold hover:opacity-90 transition"
                  style={{ width: '25rem' }}
                >
                  {isCreatingCodePending ? 'Création...' : 'Créer un code de parrainage'}
                </Button>
              </GlassCard>
            </motion.div>

            {/* Espace de 2.5rem */}
            <div style={{ height: '2.5rem' }}></div>

            {/* Informations parrain */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <GlassCard className="p-6 mb-8 text-center" style={{ maxWidth: '50rem', margin: '0 auto' }}>
                <h2 className="text-2xl font-bold text-white-pure mb-4">Informations parrain</h2>
                <div className="text-white-75">
                  <p><strong>Votre parrain:</strong> {typeof referrer === 'string' ? `${referrer.slice(0, 6)}...${referrer.slice(-4)}` : 'Non défini'}</p>
                </div>
              </GlassCard>
            </motion.div>

            {/* Codes inutilisés */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white-pure mb-6 text-center">Vos codes de parrainage</h2>
              
              {error && (
                <div className="p-4 bg-error/20 border border-error rounded-lg mb-6 text-center" style={{ maxWidth: '50rem', margin: '0 auto' }}>
                  <p className="text-error text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 bg-success/20 border border-success rounded-lg mb-6 text-center" style={{ maxWidth: '50rem', margin: '0 auto' }}>
                  <p className="text-success text-sm">{success}</p>
                </div>
              )}

              {Array.isArray(unusedCodes) && unusedCodes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white-60">Aucun code disponible - Créez-en un nouveau !</p>
                </div>
              ) : Array.isArray(unusedCodes) && unusedCodes.length > 0 ? (
                <div className="grid gap-4">
                  {unusedCodes.map((code, i) => (
                    <GlassCard key={i} className="flex flex-col items-center p-4 text-center" style={{ maxWidth: '50rem', margin: '0 auto' }}>
                      <span className="font-mono bg-axone-dark-light px-3 py-1 rounded break-all text-white-pure mb-4">
                        {code}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(code)
                            setCopiedCode(code)
                            setTimeout(() => setCopiedCode(null), 2000)
                          }}
                          className="text-sm bg-info/20 hover:bg-info px-3 py-1 rounded transition text-info"
                        >
                          {copiedCode === code ? 'Copié !' : 'Copier'}
                        </button>
                        <button 
                          onClick={() => {
                            setError('Cette fonction nécessite les droits administrateur')
                          }}
                          disabled={isLoading}
                          className="text-sm bg-error/20 hover:bg-error px-3 py-1 rounded transition text-error"
                        >
                          Supprimer
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              ) : null}
            </motion.div>

            {/* Informations utilisateur */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <p className="text-sm text-white-60">
                Adresse connectée: {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  )
}

