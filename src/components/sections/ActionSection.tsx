"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Vault, 
  Users, 
  BarChart3, 
  FileText, 
  ArrowRight,
  Rocket,
  Coins,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import GlassCard from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';

const ActionSection: React.FC = () => {
  const actions = [
    {
      icon: Vault,
      title: 'Déposer dans un Vault',
      description: 'Commencez à générer des rendements optimisés avec nos vaults intelligents',
      link: '/market',
      color: 'from-axone-accent to-axone-accent-dark',
      iconColor: 'text-axone-accent',
      buttonText: 'EXPLORER LES VAULTS',
      featured: true,
    },
    {
      icon: Users,
      title: 'Programme de Parrainage',
      description: 'Invitez vos amis et gagnez des récompenses attractives',
      link: '/referral',
      color: 'from-axone-flounce to-axone-flounce-dark',
      iconColor: 'text-axone-flounce',
      buttonText: 'DEVENIR PARRAIN',
      featured: false,
    },
    {
      icon: BarChart3,
      title: 'Gérer votre Portfolio',
      description: 'Suivez vos performances et gérez vos positions en temps réel',
      link: '/dashboard',
      color: 'from-info to-[#2563eb]',
      iconColor: 'text-info',
      buttonText: 'VOIR DASHBOARD',
      featured: false,
    },
    {
      icon: Coins,
      title: 'Participer à l\'Index',
      description: 'Investissez dans notre index diversifié et automatisé',
      link: '/market',
      color: 'from-success to-[#0d8f5a]',
      iconColor: 'text-success',
      buttonText: 'INVESTIR MAINTENANT',
      featured: true,
    },
    {
      icon: Shield,
      title: 'Gestion des Parrainages',
      description: 'Gérez votre réseau de filleuls et maximisez vos gains',
      link: '/referral-management',
      color: 'from-alert to-[#d97706]',
      iconColor: 'text-alert',
      buttonText: 'GÉRER RÉSEAU',
      featured: false,
    },
    {
      icon: FileText,
      title: 'Documentation Complète',
      description: 'Apprenez tout sur Axone et maîtrisez la DeFi',
      link: '/documentation',
      color: 'from-error to-[#dc2626]',
      iconColor: 'text-error',
      buttonText: 'LIRE LES DOCS',
      featured: false,
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-axone-dark to-axone-dark-light">
      {/* Fond animé subtil */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(250, 176, 98, 0.03) 0%, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* En-tête de section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass-cosmic px-6 py-2 rounded-full mb-6 border border-white/10"
          >
            <Rocket className="w-4 h-4 text-axone-accent" />
            <span className="text-sm font-semibold text-white-pure uppercase tracking-wider">
              Passez à l&apos;action
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white-pure">Commencez votre</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-axone-accent to-axone-flounce">
              Aventure DeFi
            </span>
          </h2>
          
          <p className="text-xl text-white-75 max-w-3xl mx-auto leading-relaxed">
            Choisissez comment vous voulez interagir avec l&apos;écosystème Axone. 
            Que vous soyez débutant ou expert, nous avons une solution pour vous.
          </p>
        </motion.div>

        {/* Grille d'actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={action.featured ? 'md:col-span-2 lg:col-span-1' : ''}
            >
              <Link href={action.link} className="block h-full group">
                <GlassCard
                  variant="dark"
                  padding="md"
                  hover={true}
                  className="h-full flex flex-col space-y-6 relative overflow-hidden group-hover:border-axone-accent/30 transition-all duration-300"
                >
                  {/* Badge featured */}
                  {action.featured && (
                    <motion.div
                      className="absolute top-4 right-4"
                      initial={{ rotate: -10 }}
                      animate={{ rotate: [10, -10, 10] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="bg-gradient-to-r from-axone-accent to-axone-accent-dark text-axone-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Populaire
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Icône avec effet de gradient */}
                  <div className="relative">
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-2xl opacity-20 blur-2xl`}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="relative w-20 h-20 rounded-2xl glass-cosmic flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
                      <action.icon className={`w-10 h-10 ${action.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 space-y-3">
                    <h3 className="text-2xl font-bold text-white-pure group-hover:text-gradient transition-all duration-300">
                      {action.title}
                    </h3>
                    <p className="text-white-75 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                  
                  {/* Bouton d'action */}
                  <div className="pt-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold uppercase tracking-wider ${action.iconColor}`}>
                        {action.buttonText}
                      </span>
                      <motion.div
                        className="relative"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className={`w-6 h-6 ${action.iconColor}`} />
                        <motion.div
                          className={`absolute inset-0 ${action.iconColor}`}
                          initial={{ opacity: 0, x: 0 }}
                          whileHover={{ opacity: 1, x: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ArrowRight className="w-6 h-6" />
                        </motion.div>
                      </motion.div>
                    </div>
                    
                    {/* Barre de progression au survol */}
                    <motion.div
                      className={`h-0.5 bg-gradient-to-r ${action.color} rounded-full mt-4`}
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA global */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-white-60 mb-6">
            Vous ne savez pas par où commencer ?
          </p>
          <GlowButton
            variant="primary"
            size="lg"
            glowColor="accent"
            className="mx-auto"
            asChild
          >
            <Link href="/documentation">
              <FileText className="w-5 h-5" />
              <span>GUIDE DE DÉMARRAGE</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
};

export default ActionSection;