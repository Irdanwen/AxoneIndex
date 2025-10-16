"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
  variant?: 'default' | 'accent' | 'flounce' | 'dark';
  hover?: boolean;
  glow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
  style,
  variant = 'default',
  hover = true,
  glow = false,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
  };
  
  const variantClasses = {
    default: 'glass-cosmic border-white/10 hover:border-axone-accent/30',
    accent: 'glass-cosmic-accent border-axone-accent/20 hover:border-axone-accent/40',
    flounce: 'glass-cosmic-flounce border-axone-flounce/20 hover:border-axone-flounce/40',
    dark: 'glass-cosmic-dark border-white/5 hover:border-white/10',
  };
  
  const glowClasses = {
    default: 'glow-cosmic',
    accent: 'glow-cosmic',
    flounce: 'glow-cosmic-flounce',
    dark: '',
  };

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      style={style}
      className={cn(
        'relative rounded-xl transition-all duration-300 overflow-hidden',
        paddingClasses[padding],
        variantClasses[variant],
        glow && glowClasses[variant],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* Effet de brillance cosmique */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 bg-gradient-conic from-transparent via-white/5 to-transparent" />
      </motion.div>
      
      {/* Effet de particules internes */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 3 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
