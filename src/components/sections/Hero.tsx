"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, DollarSign, Rocket, FileText, TrendingUp } from 'lucide-react';
import { GlowButton } from '../ui/GlowButton';
import AnimatedCounter from '../ui/AnimatedCounter';
import GlassCard from '../ui/GlassCard';
import { CosmicParticles } from '../ui/CosmicParticles';
import { GeometricShapes } from '../ui/GeometricShapes';
import Link from 'next/link';

const Hero: React.FC = () => {

  const stats = [
    { icon: Users, value: 125000, suffix: '+', label: 'Utilisateurs', color: 'text-success' },
    { icon: DollarSign, value: 45.2, prefix: '$', suffix: 'M', label: 'TVL', color: 'text-info' },
    { icon: TrendingUp, value: 18.5, prefix: '+', suffix: '%', label: 'Performance', color: 'text-alert' },
  ];

  return (
    <section id="main-content" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-axone-dark via-axone-dark-light to-axone-dark">
      {/* Fond animé cosmique */}
      <div className="absolute inset-0">
        {/* Gradient de fond animé */}
        <motion.div
          className="absolute inset-0 opacity-50"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(250, 176, 98, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(74, 140, 140, 0.15) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(250, 176, 98, 0.15) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Particules cosmiques */}
        <CosmicParticles count={30} />
        
        {/* Formes géométriques */}
        <GeometricShapes />
        
        {/* Grille futuriste */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(250, 176, 98, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(250, 176, 98, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Effet de vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-axone-dark via-transparent to-transparent opacity-70" />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Badge d'introduction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block"
            >
              <div className="glass-cosmic-accent px-6 py-2 rounded-full border border-axone-accent/30">
                <span className="text-axone-accent font-semibold uppercase text-sm tracking-wider">
                  ✨ L&apos;avenir de la DeFi est là
                </span>
              </div>
            </motion.div>
            
            {/* Titre principal futuriste */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                <motion.span
                  className="block text-white-pure"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  GET REWARDED
                </motion.span>
                <motion.span
                  className="block mt-2"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-axone-accent via-axone-accent-light to-axone-flounce animate-gradient-shift bg-[length:200%_auto]">
                    FOR SAVING
                  </span>
                </motion.span>
                <motion.span
                  className="block text-white-pure mt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  WITHOUT GIVING UP CONTROL
                </motion.span>
              </h1>
            </motion.div>

            {/* Sous-titre */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <p className="text-xl md:text-2xl text-white-75 leading-relaxed">
                Découvrez l&apos;écosystème d&apos;investissement Web3 le plus avancé. 
                <span className="text-white-pure font-semibold"> Un seul dépôt</span>, 
                <span className="text-axone-accent font-semibold"> une exposition diversifiée</span>, 
                <span className="text-axone-flounce font-semibold"> des rendements optimisés</span>.
              </p>
            </motion.div>

            {/* Boutons CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-8"
            >
              <GlowButton
                variant="primary"
                size="lg"
                glowColor="accent"
                className="min-w-[200px] group"
                asChild
              >
                <Link href="/market">
                  <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                  <span>LAUNCH APP</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </GlowButton>
              
              <GlowButton
                variant="secondary"
                size="lg"
                glowColor="flounce"
                className="min-w-[200px]"
                asChild
              >
                <Link href="/documentation">
                  <FileText className="w-5 h-5" />
                  <span>DOCUMENTATION</span>
                </Link>
              </GlowButton>
            </motion.div>

            {/* Statistiques avec compteurs animés */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto mt-20"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <GlassCard
                    variant="dark"
                    padding="sm"
                    hover={true}
                    className="text-center space-y-4"
                  >
                    {/* Icône avec effet de glow */}
                    <div className="relative inline-block">
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-axone-accent to-axone-flounce opacity-20 blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                      <div className="relative w-16 h-16 rounded-full glass-cosmic flex items-center justify-center mx-auto border border-white/10 group-hover:border-axone-accent/30 transition-all duration-300">
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </div>
                    
                    {/* Valeur animée */}
                    <div className="space-y-1">
                      <div className={`text-3xl md:text-4xl font-black ${stat.color}`}>
                        {stat.prefix && <span>{stat.prefix}</span>}
                        <AnimatedCounter 
                          value={stat.value} 
                          duration={2.5}
                          decimals={stat.value % 1 !== 0 ? 1 : 0}
                        />
                        {stat.suffix && <span>{stat.suffix}</span>}
                      </div>
                      <div className="text-white-60 text-sm font-medium uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Indicateur de scroll */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
              >
                <motion.div
                  animate={{ y: [0, 16, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-1.5 h-1.5 rounded-full bg-axone-accent"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
