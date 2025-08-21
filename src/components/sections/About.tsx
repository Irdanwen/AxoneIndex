"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Button } from '../ui';

const About: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: "Secure Protocol",
      description: "Multi-layer security with audited smart contracts"
    },
    {
      icon: Zap,
      title: "Instant Rewards",
      description: "Earn rewards immediately without lock-up periods"
    },
    {
      icon: TrendingUp,
      title: "Optimized Performance",
      description: "AI-driven strategies for maximum yield generation"
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
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Contenu texte à gauche */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >


            {/* Titre */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-6xl font-black text-white-pure leading-tight"
            >
              The Future of{' '}
              <span className="text-gradient">DeFi</span>
              <br />
              is Here
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-white-85 leading-relaxed"
            >
              Axone Finance represents the next evolution in decentralized finance. 
              Our protocol combines cutting-edge technology with proven DeFi principles 
              to deliver unprecedented opportunities for users to earn while maintaining 
              complete control over their assets.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 glass-card rounded-xl flex items-center justify-center border border-axone-accent-20">
                    <feature.icon className="w-6 h-6 text-axone-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white-pure mb-2">{feature.title}</h3>
                    <p className="text-white-75">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              viewport={{ once: true }}
            >
              <Button 
                variant="secondary" 
                size="lg" 
                className="btn-with-icon hover:shadow-glow-flounce transition-all duration-300"
              >
                Access Axone
                <ArrowRight className="w-5 h-5 btn-icon" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Illustration à droite */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center"
          >
            {/* Carte principale */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card-strong p-3 md:p-4 lg:p-5 rounded-2xl relative overflow-hidden border border-axone-accent-20 hover:border-axone-accent transition-colors w-30"
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white-10 to-transparent transform -skew-x-12 -translate-x-full animate-shimmer"></div>
              
              <div className="relative z-10 text-center">
                {/* Logo Axone du projet */}
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-25 h-25 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 shadow-glow overflow-hidden"
                >
                  <Image 
                    src="/core_logo.png" 
                    alt="Axone Logo" 
                    width={100}
                    height={100}
                    className="w-full h-full object-contain p-2"
                  />
                </motion.div>
                
                <h3 className="text-lg md:text-xl font-bold text-white-pure mb-2 md:mb-3">
                  Axone Token
                </h3>
                <p className="text-white-85 mb-3 md:mb-4 leading-relaxed text-xs md:text-sm">
                  The native token powering the Axone ecosystem with{' '}
                  <span className="text-axone-accent font-semibold">governance rights</span> and{' '}
                  <span className="text-axone-flounce font-semibold">reward distribution</span>
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-black text-axone-accent">1M</div>
                    <div className="text-xs text-white-60 font-medium">Total Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-black text-axone-flounce">$2.45</div>
                    <div className="text-xs text-white-60 font-medium">Current Price</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cartes flottantes */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="absolute -top-2 -right-2 md:-top-3 md:-right-3 lg:-top-4 lg:-right-4 glass-card p-2 md:p-3 lg:p-4 rounded-xl border border-axone-accent-20 hover:border-axone-accent transition-all duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white-pure" />
                </div>
                <div>
                  <div className="text-sm md:text-base font-bold text-white-pure">+24.7%</div>
                  <div className="text-xs text-white-60 font-medium">30d</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 lg:-bottom-4 lg:-left-4 glass-card p-2 md:p-3 lg:p-4 rounded-xl border border-axone-flounce-20 hover:border-axone-flounce transition-all duration-300"
            >
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-secondary rounded-lg flex items-center justify-center">
                  <Shield className="w-3 h-3 md:w-4 md:h-4 text-white-pure" />
                </div>
                <div>
                  <div className="text-sm md:text-base font-bold text-white-pure">Audited</div>
                  <div className="text-xs text-white-60 font-medium">Security</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;
