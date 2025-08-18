"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users, ChevronRight, DollarSign, BarChart3 } from 'lucide-react';
import Button from '../ui/Button';
import AnimatedCounter from '../ui/AnimatedCounter';
import GlassCard from '../ui/GlassCard';

const Hero: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
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
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
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
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center mb-16"
          >
            <Button 
              variant="primary" 
              size="lg" 
              className="btn-with-icon group hover:shadow-glow transition-all duration-300"
            >
              Launch App
              <ArrowRight className="w-5 h-5 btn-icon" />
            </Button>
          </motion.div>

          {/* Statistiques */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
            transition={{ delay: 0.6 }}
            className="flex flex-row justify-center items-center"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.05 }}
                className="text-center group px-lg md:px-xl lg:px-2xl"
              >
                <GlassCard className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4 mx-auto border border-axone-accent-20">
                  <stat.icon className="w-8 h-8 text-axone-accent" />
                </GlassCard>
                <div className="stat-value text-3xl font-black text-white-pure mb-1">
                  <AnimatedCounter value={stat.value} duration={2} />
                </div>
                <div className="stat-label text-white-60 font-medium text-base">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
