"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Shield, TrendingUp, Users, Globe, Coins, Target } from 'lucide-react';
import ClientOnly from '../ui/ClientOnly';

const HowItWorks: React.FC = () => {
  const stars = [
    { icon: Star, title: "Governance", description: "Community-driven decision making" },
    { icon: Zap, title: "Staking", description: "Earn rewards by staking tokens" },
    { icon: Shield, title: "Security", description: "Multi-layer protection system" },
    { icon: TrendingUp, title: "Yield", description: "Optimized yield generation" },
    { icon: Users, title: "Community", description: "Growing global ecosystem" },
    { icon: Globe, title: "Access", description: "Global accessibility" },
    { icon: Coins, title: "Rewards", description: "Fair reward distribution" },
    { icon: Target, title: "Strategy", description: "Advanced DeFi strategies" },
  ];

  return (
    <section id="axone-stars" className="py-24 relative overflow-hidden min-h-screen flex items-center">
      {/* Fond sombre avec ciel étoilé */}
      <div className="absolute inset-0 bg-gradient-to-b from-axone-dark via-axone-dark-light to-axone-dark">
        {/* Étoiles animées */}
        <ClientOnly>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                style={{
                  left: `${(i * 5) % 100}%`,
                  top: `${(i * 7) % 100}%`,
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + (i % 3),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: (i * 0.1) % 2,
                }}
              />
            ))}
          </div>
        </ClientOnly>

        {/* Formes géométriques cosmiques */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute w-64 h-64 border border-axone-accent-20 rounded-full"
            style={{ top: '10%', right: '5%' }}
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute w-48 h-48 border border-axone-flounce-20 rounded-full"
            style={{ bottom: '20%', left: '10%' }}
            animate={{
              rotate: [360, 0],
              scale: [1, 0.8, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center space-y-16">
          {/* Titre principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-3 glass-card px-8 py-4 rounded-full border border-axone-accent-20"
            >
              <Star className="w-6 h-6 text-axone-accent" />
              <span className="text-lg font-semibold text-white-pure">Axone Stars</span>
            </motion.div>

            <h2 className="text-5xl lg:text-7xl font-black text-white-pure leading-tight">
              Discover the{' '}
              <span className="text-gradient">Constellation</span>
              <br />
              of Possibilities
            </h2>

            <div className="space-y-4 max-w-4xl mx-auto">
              <p className="text-xl text-white-85 font-medium leading-relaxed text-center">
                Explore the core pillars that make Axone Finance the leading DeFi protocol.
              </p>
              <p className="text-xl text-white-85 font-medium leading-relaxed text-center">
                Each star represents a fundamental aspect of our ecosystem, working together 
                to create a seamless and rewarding experience.
              </p>
            </div>
          </motion.div>

          {/* Grille des étoiles en constellation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto"
          >
            {stars.map((star, index) => (
              <motion.div
                key={star.title}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="group relative"
              >
                {/* Lignes de connexion */}
                {index < stars.length - 1 && (
                  <div className="absolute top-1/2 left-full w-full h-px bg-gradient-to-r from-axone-accent-20 to-transparent transform -translate-y-1/2 hidden md:block" />
                )}
                {index < stars.length - 4 && (
                  <div className="absolute top-full left-1/2 w-px h-full bg-gradient-to-b from-axone-flounce-20 to-transparent transform -translate-x-1/2 hidden md:block" />
                )}

                <div className="glass-card-strong p-8 rounded-3xl text-center border border-axone-accent-20 hover:border-axone-accent transition-all duration-300 group-hover:shadow-glow">
                  <motion.div
                    className="w-20 h-20 glass-card rounded-2xl flex items-center justify-center mx-auto mb-6 border border-axone-accent-20"
                  >
                    <star.icon className="w-10 h-10 text-axone-accent" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-white-pure mb-3 group-hover:text-axone-accent transition-colors">
                    {star.title}
                  </h3>
                  
                  <p className="text-white-75 text-sm leading-relaxed">
                    {star.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Section supplémentaire */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
            className="glass-card-strong p-12 rounded-3xl border border-axone-accent-20 max-w-4xl mx-auto"
          >
            <div className="text-center space-y-6">
              <h3 className="text-3xl font-bold text-white-pure">
                Join the Constellation
              </h3>
              <p className="text-white-85 text-lg leading-relaxed">
                Become part of the Axone ecosystem and discover how each component 
                works together to create a powerful DeFi experience. From governance 
                to yield generation, every aspect is designed with the community in mind.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-4xl font-black text-axone-accent mb-2">8</div>
                  <div className="text-white-75 font-medium">Core Features</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-axone-flounce mb-2">24/7</div>
                  <div className="text-white-75 font-medium">Active Protocol</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-black text-axone-accent mb-2">100%</div>
                  <div className="text-white-75 font-medium">Community Driven</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
