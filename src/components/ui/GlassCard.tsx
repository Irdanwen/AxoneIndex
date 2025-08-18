"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`glass-card backdrop-blur-lg border border-white-20 hover:border-axone-accent-20 transition-all duration-300 ${paddingClasses[padding]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Effet de brillance subtil */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white-5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Contenu */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
