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
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`glass-card ${paddingClasses[padding]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
