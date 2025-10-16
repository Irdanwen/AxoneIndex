"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: 'accent' | 'flounce' | 'white';
  asChild?: boolean;
}

export const GlowButton: React.FC<GlowButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  glowColor = 'accent',
  className,
  asChild = false,
  ...props
}) => {
  const baseClasses = "relative font-inter font-bold uppercase tracking-wider transition-all duration-300 rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-axone-dark";
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-axone-accent to-axone-accent-dark text-axone-dark",
    secondary: "bg-transparent border-2 border-axone-flounce text-white-pure",
    ghost: "bg-transparent text-white-pure",
  };
  
  const glowClasses = {
    accent: "hover:shadow-[0_0_30px_rgba(250,176,98,0.5)] focus:ring-axone-accent",
    flounce: "hover:shadow-[0_0_30px_rgba(74,140,140,0.5)] focus:ring-axone-flounce",
    white: "hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] focus:ring-white",
  };

  const Component = asChild ? motion.div : motion.button;
  
  // Si asChild est true, on passe seulement le className et les styles
  const componentProps = asChild 
    ? { className: cn(baseClasses, sizeClasses[size], variantClasses[variant], glowClasses[glowColor], className) }
    : { 
        className: cn(baseClasses, sizeClasses[size], variantClasses[variant], glowClasses[glowColor], className),
        ...props 
      };

  return (
    <Component
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      {...componentProps}
    >
      {/* Effet de brillance au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Effet de glow de fond */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-axone-accent/20 to-axone-flounce/20 blur-xl" />
      </div>
      
      {/* Contenu du bouton */}
      {asChild ? (
        children
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </Component>
  );
};

export default GlowButton;