"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '../ui';
import AnimatedCounter from '../ui/AnimatedCounter';
import GlassCard from '../ui/GlassCard';
import Link from 'next/link';

const Hero: React.FC = () => {

  const stats = [
    { icon: Users, value: '125K+', label: 'Users' },
    { icon: DollarSign, value: '$45.2M', label: 'TVL' },
    { icon: BarChart3, value: '+18.5%', label: 'Performance' },
  ];

  return (
    <section id="home" className="hero-gradient min-h-screen flex items-center relative overflow-hidden">
      {/* Particules de fond animées améliorées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-2 h-2 bg-axone-accent rounded-full opacity-60"
          style={{ top: '20%', left: '10%' }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-3 h-3 bg-axone-flounce rounded-full opacity-40"
          style={{ top: '60%', right: '15%' }}
          animate={{
            y: [0, 15, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute w-1 h-1 bg-white-pure rounded-full opacity-80"
          style={{ top: '80%', left: '20%' }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className="absolute w-4 h-4 bg-axone-accent-light rounded-full opacity-30"
          style={{ top: '30%', right: '30%' }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>

      {/* Formes géométriques animées */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-32 h-32 border border-axone-accent-20 rounded-full"
          style={{ top: '10%', right: '10%' }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute w-24 h-24 border border-axone-flounce-20 rounded-full"
          style={{ bottom: '20%', left: '5%' }}
          animate={{
            rotate: [360, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Grille de fond améliorée */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-white-pure) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center">
          {/* Titre principal */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hero-title font-black max-w-4xl mx-auto mb-16"
          >
            <span className="text-white-pure">Axone Index</span>
            <br />
            <span className="text-gradient">L&apos;investissement Web3 réinventé</span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 max-w-4xl mx-auto mb-16"
          >
            <p className="text-white-85 font-medium leading-relaxed text-xl text-center">
              Un seul actif en entrée, une exposition instantanée à plusieurs projets crypto
            </p>
          </motion.div>

          {/* Boutons CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center"
            style={{ gap: '5rem' }}
          >
            <Button 
              variant="default" 
              size="lg" 
              asChild
              className="btn-with-icon group hover:shadow-glow transition-all duration-300"
            >
              <Link href="/referral">
                Launch App
                <ArrowRight className="w-5 h-5 btn-icon" />
              </Link>
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              asChild
              className="hover:shadow-glow-flounce transition-all duration-300"
            >
              <Link href="/documentation">
                Documentation
              </Link>
            </Button>
          </motion.div>

          {/* Espacement entre les boutons et les statistiques */}
          <div style={{ marginTop: '10rem' }}></div>

          {/* Statistiques */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center items-center max-w-4xl mx-auto"
            style={{ gap: '10rem' }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="text-center group px-4 py-2 min-w-[120px]"
              >
                <GlassCard className="flex items-center justify-center w-14 h-14 rounded-xl mb-3 mx-auto border border-axone-accent-20">
                  <stat.icon className="w-7 h-7 text-axone-accent" />
                </GlassCard>
                <div className="stat-value text-2xl font-bold text-white-pure mb-1">
                  <AnimatedCounter value={stat.value} duration={2} />
                </div>
                <div className="stat-label text-white-60 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
