"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui';
import GlassCard from '@/components/ui/GlassCard';

const About: React.FC = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Rééquilibrage intelligent',
      description: 'Vos positions s’adaptent automatiquement au marché.'
    },
    {
      icon: Zap,
      title: 'Liquidité native Hypercore',
      description: 'Exécution rapide, slippage minimal, frais optimisés.'
    },
    {
      icon: Shield,
      title: 'Sécurité HyperUnit',
      description: 'Actifs natifs, transparents et traçables on-chain.'
    }
  ];

  return (
    <section id="axone" className="py-24 relative overflow-hidden">
      {/* Background avec formes géométriques */}
      <div className="absolute inset-0 bg-gradient-to-b from-axone-dark to-axone-dark-light">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 border border-axone-accent-20 rounded-full"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 border border-axone-flounce-20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-axone-accent-10 rounded-full"></div>
        </div>
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Colonne gauche : message principal */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-6xl font-black text-white-pure leading-tight"
            >
              Axone <span className="text-gradient">Index</span>
              <br />
              L’investissement Web3, réinventé
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              viewport={{ once: true }}
              className="text-xl text-white-85 leading-relaxed"
            >
              Exposition instantanée à plusieurs actifs, rééquilibrage automatique, transparence on-chain.
              Axone transforme la complexité du Web3 en un produit simple, performant et accessible.
            </motion.p>

            {/* Points clés inspirés de la documentation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 glass-card rounded-xl flex items-center justify-center border border-axone-accent-20">
                    <feature.icon className="w-6 h-6 text-axone-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white-pure mb-1">{feature.title}</h3>
                    <p className="text-white-75">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row"
            >
              <Button asChild size="lg" className="hover:shadow-glow-flounce mb-[2rem] last:mb-0 sm:mb-0 sm:mr-[2rem] last:sm:mr-0 w-[20rem]">
                <Link href="/documentation">
                  Découvrir la documentation
                  <ArrowRight className="w-5 h-5 ml-2 inline-block align-middle" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="hover:shadow-glow mb-[2rem] last:mb-0 sm:mb-0 sm:mr-[2rem] last:sm:mr-0 w-[20rem]">
                <Link href="/referral">
                  Accéder à la plateforme
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Colonne droite : cartes d'aperçu inspirées de la doc */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className=""
          >
            <GlassCard className="p-6 border border-axone-accent-20 max-w-[30rem] mb-[2rem] last:mb-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-axone-accent" />
                  <h3 className="text-lg font-bold text-white-pure">Smart Rebalancing</h3>
                </div>
                <p className="text-white-85 text-sm leading-relaxed">
                  Toutes les heures, vos index s’ajustent automatiquement : capture des gains,
                  réduction du risque, allocation optimisée — sans effort.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border border-axone-flounce-20 max-w-[30rem] mb-[2rem] last:mb-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-axone-flounce" />
                  <h3 className="text-lg font-bold text-white-pure">Hypercore Liquidity</h3>
                </div>
                <p className="text-white-85 text-sm leading-relaxed">
                  Accès direct à la liquidité native d’Hyperliquid : exécution instantanée,
                  slippage minimal, expérience fluide à chaque transaction.
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 border border-white-10 max-w-[30rem] mb-[2rem] last:mb-0">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-white-85" />
                  <h3 className="text-lg font-bold text-white-pure">HyperUnit Security</h3>
                </div>
                <p className="text-white-85 text-sm leading-relaxed">
                  Transparence et sécurité au cœur du protocole : actifs natifs, traçabilité on-chain,
                  alignement durable avec l’écosystème Hyperliquid.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
