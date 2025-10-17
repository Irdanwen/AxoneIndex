"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { StarConstellation } from '../ui/StarConstellation';
import { Sparkles } from 'lucide-react';

const AxoneStars: React.FC = () => {
  return (
    <section id="stars" className="relative py-32 overflow-hidden bg-gradient-to-b from-axone-dark-light to-axone-dark">
      {/* Fond étoilé animé */}
      <div className="absolute inset-0">
        {/* Ciel étoilé de fond */}
        <div className="absolute inset-0">
          {Array.from({ length: 100 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 3 + 'px',
                height: Math.random() * 3 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        {/* Effet de nébuleuse */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(250, 176, 98, 0.05) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Effet d'aurore cosmique */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1/2"
          style={{
            background: 'linear-gradient(180deg, rgba(74, 140, 140, 0.1) 0%, transparent 100%)',
          }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
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
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass-cosmic px-6 py-2 rounded-full mb-6 border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-axone-accent animate-twinkle" />
            <span className="text-sm font-semibold text-white-pure uppercase tracking-wider">
              L&apos;écosystème Axone
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
            <span className="text-white-pure">Explorez les</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-axone-accent via-axone-accent-light to-axone-flounce animate-gradient-shift bg-[length:200%_auto]">
              Étoiles d&apos;Axone
            </span>
          </h2>
          
          <p className="text-xl text-white-75 max-w-3xl mx-auto leading-relaxed">
            Chaque étoile représente une fonctionnalité clé de notre écosystème. 
            Cliquez sur une étoile pour découvrir comment Axone révolutionne la DeFi.
          </p>
        </motion.div>

        {/* Constellation interactive */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <StarConstellation />
        </motion.div>

        {/* Légende */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-white-60 text-sm">
            💡 Astuce : Survolez les étoiles pour voir les connexions • Cliquez pour plus de détails
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AxoneStars;