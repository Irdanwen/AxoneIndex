"use client";

import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Shield, Zap, TrendingUp, Coins, Users, BarChart3, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import { GlowButton } from '../ui/GlowButton';
import GlassCard from '@/components/ui/GlassCard';
import { CosmicParticles } from '../ui/CosmicParticles';

const About: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0.1, 0.3], [0.5, 1]);
  const scale = useTransform(scrollYProgress, [0.1, 0.3], [0.95, 1]);
  
  const features = [
    {
      icon: TrendingUp,
      title: 'Rééquilibrage Intelligent',
      description: 'Algorithmes avancés qui ajustent automatiquement vos positions selon les conditions de marché.',
      gradient: 'from-axone-accent to-axone-accent-dark',
      iconColor: 'text-axone-accent',
      glowColor: 'hover:shadow-[0_0_30px_rgba(250,176,98,0.3)]',
    },
    {
      icon: Zap,
      title: 'Liquidité Native',
      description: 'Accès direct à la liquidité profonde d&apos;Hyperliquid pour une exécution instantanée.',
      gradient: 'from-axone-flounce to-axone-flounce-dark',
      iconColor: 'text-axone-flounce',
      glowColor: 'hover:shadow-[0_0_30px_rgba(74,140,140,0.3)]',
    },
    {
      icon: Shield,
      title: 'Sécurité Maximale',
      description: 'Smart contracts audités, architecture décentralisée et transparence totale on-chain.',
      gradient: 'from-success to-[#0d8f5a]',
      iconColor: 'text-success',
      glowColor: 'hover:shadow-[0_0_30px_rgba(60,216,140,0.3)]',
    },
    {
      icon: Coins,
      title: 'Index Diversifié',
      description: 'Exposition instantanée à un panier d&apos;actifs crypto soigneusement sélectionnés.',
      gradient: 'from-info to-[#2563eb]',
      iconColor: 'text-info',
      glowColor: 'hover:shadow-[0_0_30px_rgba(77,159,255,0.3)]',
    },
    {
      icon: Users,
      title: 'Programme de Parrainage',
      description: 'Gagnez des récompenses attractives en partageant Axone avec votre réseau.',
      gradient: 'from-alert to-[#d97706]',
      iconColor: 'text-alert',
      glowColor: 'hover:shadow-[0_0_30px_rgba(255,176,32,0.3)]',
    },
    {
      icon: BarChart3,
      title: 'Analytics Avancés',
      description: 'Tableaux de bord détaillés pour suivre et optimiser vos performances.',
      gradient: 'from-error to-[#dc2626]',
      iconColor: 'text-error',
      glowColor: 'hover:shadow-[0_0_30px_rgba(255,92,92,0.3)]',
    }
  ];

  return (
    <section id="about" className="relative py-32 overflow-hidden bg-gradient-to-b from-axone-dark to-axone-dark-light">
      {/* Fond animé futuriste */}
      <motion.div 
        className="absolute inset-0"
        style={{ opacity }}
      >
        {/* Particules cosmiques légères */}
        <CosmicParticles count={15} className="opacity-30" />
        
        {/* Grille 3D perspective */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(250, 176, 98, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(74, 140, 140, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center center',
          }}
        />
        
        {/* Effet de halo lumineux */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(250, 176, 98, 0.05) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      <div className="container-custom relative z-10">
        {/* En-tête de section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass-cosmic px-6 py-2 rounded-full mb-6 border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-axone-accent" />
            <span className="text-sm font-semibold text-white-pure uppercase tracking-wider">
              La révolution DeFi
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white-pure">L&apos;investissement Web3</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-axone-accent to-axone-flounce">
              Simplifié et Optimisé
            </span>
          </h2>
          
          <p className="text-xl text-white-75 max-w-3xl mx-auto leading-relaxed">
            Axone transforme la complexité du Web3 en une expérience fluide et accessible. 
            Un seul protocole, des rendements optimisés, une sécurité maximale.
          </p>
        </motion.div>

        {/* Layout en deux colonnes */}
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Colonne gauche : Description détaillée */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ scale }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl font-bold text-white-pure mb-4 flex items-center gap-3">
                  <Globe className="w-8 h-8 text-axone-accent" />
                  Une Vision Globale
                </h3>
                <p className="text-lg text-white-85 leading-relaxed">
                  Axone Index révolutionne l&apos;investissement crypto en combinant la puissance de la DeFi 
                  avec la simplicité d&apos;utilisation. Notre protocole intelligent gère automatiquement 
                  vos positions pour maximiser les rendements tout en minimisant les risques.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <h4 className="text-2xl font-semibold text-white-pure">
                  Pourquoi choisir Axone ?
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-axone-accent mt-2 flex-shrink-0" />
                    <span className="text-white-75">
                      <strong className="text-white-pure">Simplicité absolue :</strong> Un seul dépôt 
                      vous donne accès à un portefeuille diversifié et optimisé.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-axone-flounce mt-2 flex-shrink-0" />
                    <span className="text-white-75">
                      <strong className="text-white-pure">Performance maximale :</strong> Nos algorithmes 
                      ajustent constamment votre exposition pour capturer les meilleures opportunités.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0" />
                    <span className="text-white-75">
                      <strong className="text-white-pure">Transparence totale :</strong> Toutes les 
                      opérations sont vérifiables on-chain, sans zone d&apos;ombre.
                    </span>
                  </li>
                </ul>
              </motion.div>
            </div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              <GlowButton
                variant="primary"
                size="lg"
                glowColor="accent"
                className="group"
                asChild
              >
                <Link href="/documentation">
                  <span>EXPLORER LA DOCUMENTATION</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </GlowButton>
              
              <GlowButton
                variant="secondary"
                size="lg"
                glowColor="flounce"
                asChild
              >
                <Link href="/market">
                  <span>COMMENCER MAINTENANT</span>
                </Link>
              </GlowButton>
            </motion.div>
          </motion.div>

          {/* Colonne droite : Grille de fonctionnalités */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <GlassCard
                  variant="dark"
                  padding="sm"
                  hover={true}
                  className={`h-full space-y-4 ${feature.glowColor} transition-all duration-300`}
                >
                  {/* Icône avec gradient de fond */}
                  <div className="relative">
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-xl opacity-20 blur-xl`}
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="relative w-14 h-14 rounded-xl glass-cosmic flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-all duration-300">
                      <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white-pure">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white-75 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Indicateur visuel au survol */}
                  <motion.div
                    className={`h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full`}
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;