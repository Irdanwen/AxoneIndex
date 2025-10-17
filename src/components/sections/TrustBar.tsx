"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe, Lock, Server, CheckCircle } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

const TrustBar: React.FC = () => {
  const partners = [
    { 
      name: 'Hyperliquid', 
      type: 'Infrastructure', 
      description: 'DEX haute performance',
      logo: 'H',
      gradient: 'from-axone-accent to-axone-accent-dark'
    },
    { 
      name: 'Unit', 
      type: 'Technologie', 
      description: 'Actifs natifs stables',
      logo: 'U',
      gradient: 'from-axone-flounce to-axone-flounce-dark'
    },
    { 
      name: 'HyperEVM', 
      type: 'Blockchain', 
      description: 'Scalabilité maximale',
      logo: 'E',
      gradient: 'from-info to-[#2563eb]'
    },
    { 
      name: 'Hypercore', 
      type: 'Liquidité', 
      description: 'Liquidité profonde',
      logo: 'C',
      gradient: 'from-success to-[#0d8f5a]'
    },
  ];

  const trustPoints = [
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Smart contracts audités',
      stat: '100%',
      statLabel: 'Sécurisé',
      color: 'text-success'
    },
    {
      icon: Zap,
      title: 'Ultra-Rapide',
      description: 'Exécution instantanée',
      stat: '<1s',
      statLabel: 'Latence',
      color: 'text-alert'
    },
    {
      icon: Globe,
      title: 'Décentralisé',
      description: '100% on-chain',
      stat: '24/7',
      statLabel: 'Disponible',
      color: 'text-info'
    },
    {
      icon: Lock,
      title: 'Non-Custodial',
      description: 'Gardez le contrôle',
      stat: '0',
      statLabel: 'Intermédiaire',
      color: 'text-axone-accent'
    },
    {
      icon: Server,
      title: 'Transparent',
      description: 'Vérifiable on-chain',
      stat: '∞',
      statLabel: 'Traçabilité',
      color: 'text-axone-flounce'
    },
    {
      icon: CheckCircle,
      title: 'Audité',
      description: 'Par des experts',
      stat: '✓',
      statLabel: 'Certifié',
      color: 'text-success'
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-axone-dark-light via-axone-dark to-axone-dark-light">
      {/* Fond animé */}
      <div className="absolute inset-0">
        {/* Lignes de connexion animées */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <motion.line
            x1="0%"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="url(#trust-gradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
          <defs>
            <linearGradient id="trust-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(250, 176, 98, 0.5)" />
              <stop offset="50%" stopColor="rgba(74, 140, 140, 0.5)" />
              <stop offset="100%" stopColor="rgba(250, 176, 98, 0.5)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container-custom relative z-10">
        {/* Partners Section avec animation de défilement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h3 className="text-2xl font-bold text-white-pure text-center mb-12">
            Construit avec les meilleurs de l&apos;écosystème
          </h3>
          
          {/* Bandeau défilant des partenaires */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-8"
              animate={{
                x: ["0%", "-50%"],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 20,
                  ease: "linear",
                },
              }}
            >
              {/* Dupliquer les partenaires pour l'effet de boucle infinie */}
              {[...partners, ...partners].map((partner, index) => (
                <motion.div
                  key={`${partner.name}-${index}`}
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                >
                  <GlassCard
                    variant="dark"
                    padding="sm"
                    className="w-64 h-32 flex flex-col items-center justify-center space-y-2 group"
                    hover={true}
                  >
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${partner.gradient} flex items-center justify-center mb-2 group-hover:animate-pulse-glow`}>
                      <span className="text-2xl font-black text-white-pure">
                        {partner.logo}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white-pure">{partner.name}</h4>
                    <p className="text-xs text-white-60 uppercase tracking-wider">{partner.type}</p>
                    <p className="text-sm text-white-75">{partner.description}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Gradients de fondu sur les bords */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-axone-dark-light to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-axone-dark-light to-transparent pointer-events-none" />
          </div>
        </motion.div>

        {/* Trust Points avec statistiques */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold text-white-pure text-center mb-12">
            Pourquoi nous faire confiance ?
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {trustPoints.map((point, index) => (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <GlassCard
                  variant="dark"
                  padding="sm"
                  hover={true}
                  className="h-full text-center space-y-3"
                >
                  {/* Icône */}
                  <div className="relative inline-block">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-axone-accent to-axone-flounce opacity-20 blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <div className="relative w-12 h-12 rounded-full glass-cosmic flex items-center justify-center mx-auto border border-white/10 group-hover:border-axone-accent/30 transition-all duration-300">
                      <point.icon className={`w-6 h-6 ${point.color}`} />
                    </div>
                  </div>
                  
                  {/* Statistique */}
                  <div>
                    <div className={`text-2xl font-black ${point.color}`}>
                      {point.stat}
                    </div>
                    <div className="text-xs text-white-60 uppercase tracking-wider">
                      {point.statLabel}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-bold text-white-pure mb-1">
                      {point.title}
                    </h4>
                    <p className="text-xs text-white-60">
                      {point.description}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Badge de certification */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-6 glass-cosmic px-8 py-4 rounded-full border border-white/10">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm font-semibold text-white-pure">Audité</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-info" />
              <span className="text-sm font-semibold text-white-pure">Sécurisé</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-alert" />
              <span className="text-sm font-semibold text-white-pure">Performant</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBar;
