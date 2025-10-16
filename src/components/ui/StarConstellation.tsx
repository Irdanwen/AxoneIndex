"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  RefreshCw, 
  BarChart3, 
  Coins, 
  Globe 
} from 'lucide-react';

interface Star {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  x: number;
  y: number;
  connections: string[];
}

const stars: Star[] = [
  {
    id: 'rebalancing',
    icon: RefreshCw,
    title: 'Rééquilibrage Intelligent',
    description: 'Ajustement automatique des positions selon les conditions du marché',
    x: 50,
    y: 20,
    connections: ['security', 'liquidity'],
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Sécurité HyperUnit',
    description: 'Actifs natifs, transparents et traçables on-chain',
    x: 80,
    y: 35,
    connections: ['liquidity', 'trading'],
  },
  {
    id: 'liquidity',
    icon: Zap,
    title: 'Liquidité Native',
    description: 'Accès direct à la liquidité Hypercore pour une exécution optimale',
    x: 85,
    y: 65,
    connections: ['trading', 'performance'],
  },
  {
    id: 'referral',
    icon: Users,
    title: 'Programme de Parrainage',
    description: 'Gagnez des récompenses en partageant Axone avec votre réseau',
    x: 65,
    y: 80,
    connections: ['performance', 'index'],
  },
  {
    id: 'performance',
    icon: BarChart3,
    title: 'Performance Optimisée',
    description: 'Stratégies algorithmiques pour maximiser les rendements',
    x: 35,
    y: 80,
    connections: ['index', 'trading'],
  },
  {
    id: 'index',
    icon: Coins,
    title: 'Index Diversifié',
    description: 'Exposition instantanée à plusieurs actifs crypto performants',
    x: 15,
    y: 65,
    connections: ['trading', 'decentralized'],
  },
  {
    id: 'trading',
    icon: TrendingUp,
    title: 'Trading Automatisé',
    description: 'Exécution intelligente des ordres sans intervention manuelle',
    x: 20,
    y: 35,
    connections: ['decentralized', 'rebalancing'],
  },
  {
    id: 'decentralized',
    icon: Globe,
    title: '100% Décentralisé',
    description: 'Protocole entièrement on-chain, sans intermédiaire',
    x: 50,
    y: 50,
    connections: ['rebalancing'],
  },
];

export const StarConstellation: React.FC = () => {
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [hoveredStar, setHoveredStar] = useState<string | null>(null);

  const getStarById = (id: string) => stars.find(star => star.id === id);

  return (
    <div className="relative w-full h-[600px] mx-auto">
      {/* Lignes de constellation */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="constellation-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(250, 176, 98, 0.3)" />
            <stop offset="100%" stopColor="rgba(74, 140, 140, 0.3)" />
          </linearGradient>
        </defs>
        
        {stars.map((star) => 
          star.connections.map((connectionId) => {
            const connectedStar = getStarById(connectionId);
            if (!connectedStar) return null;
            
            const isActive = hoveredStar === star.id || hoveredStar === connectionId;
            
            return (
              <motion.line
                key={`${star.id}-${connectionId}`}
                x1={`${star.x}%`}
                y1={`${star.y}%`}
                x2={`${connectedStar.x}%`}
                y2={`${connectedStar.y}%`}
                stroke={isActive ? "url(#constellation-gradient)" : "rgba(255, 255, 255, 0.1)"}
                strokeWidth={isActive ? 2 : 1}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: isActive ? 0.8 : 0.3,
                }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="animate-constellation-draw"
              />
            );
          })
        )}
      </svg>

      {/* Étoiles */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${star.x}%`, top: `${star.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
        >
          <motion.button
            className={`relative group ${hoveredStar === star.id ? 'z-20' : 'z-10'}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredStar(star.id)}
            onHoverEnd={() => setHoveredStar(null)}
            onClick={() => setSelectedStar(star)}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: hoveredStar === star.id
                  ? '0 0 30px rgba(250, 176, 98, 0.8), 0 0 60px rgba(250, 176, 98, 0.4)'
                  : '0 0 20px rgba(250, 176, 98, 0.4)',
              }}
              transition={{ duration: 0.3 }}
            />
            
            {/* Étoile principale */}
            <div className="relative w-16 h-16 rounded-full glass-cosmic-accent flex items-center justify-center border-2 border-axone-accent/40 group-hover:border-axone-accent transition-all duration-300">
              <star.icon className="w-8 h-8 text-axone-accent" />
            </div>
            
            {/* Pulsation */}
            <motion.div
              className="absolute inset-0 rounded-full border border-axone-accent/20"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.button>
          
          {/* Label au survol */}
          <AnimatePresence>
            {hoveredStar === star.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap"
              >
                <div className="glass-cosmic px-3 py-1 rounded-lg">
                  <p className="text-sm font-semibold text-white-pure">{star.title}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
      
      {/* Modal de détail */}
      <AnimatePresence>
        {selectedStar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedStar(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="glass-cosmic-dark p-8 rounded-2xl max-w-md border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full glass-cosmic-accent flex items-center justify-center">
                  <selectedStar.icon className="w-8 h-8 text-axone-accent" />
                </div>
                <h3 className="text-2xl font-bold text-white-pure">{selectedStar.title}</h3>
              </div>
              <p className="text-white-75 leading-relaxed">{selectedStar.description}</p>
              <button
                className="mt-6 px-6 py-2 bg-gradient-to-r from-axone-accent to-axone-accent-dark text-axone-dark font-semibold rounded-lg hover:shadow-glow transition-all duration-300"
                onClick={() => setSelectedStar(null)}
              >
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StarConstellation;