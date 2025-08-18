"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 2, 
  className = "" 
}) => {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    // Extraire le nombre et le suffixe (comme "K+", "M", etc.)
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const suffix = value.replace(/[0-9.]/g, '');
    
    if (isNaN(numericValue)) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);

      // Fonction d'easing pour une animation plus naturelle
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (numericValue - startValue) * easeOutQuart;

      setDisplayValue(currentValue.toFixed(1) + suffix);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {displayValue}
    </motion.span>
  );
};

export default AnimatedCounter;
