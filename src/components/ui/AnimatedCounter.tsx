"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface AnimatedCounterProps {
  value: string | number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 2, 
  className = "",
  prefix = "",
  suffix = "",
  decimals = 0
}) => {
  const [displayValue, setDisplayValue] = useState('0');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let numericValue: number;
    let extractedSuffix = suffix;
    
    // Gérer à la fois les strings et les nombres
    if (typeof value === 'string') {
      // Extraire le nombre et le suffixe (comme "K+", "M", etc.)
      numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
      if (!suffix) {
        extractedSuffix = value.replace(/[0-9.]/g, '');
      }
    } else {
      numericValue = value;
    }
    
    if (isNaN(numericValue)) {
      setDisplayValue(String(value));
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

      setDisplayValue(currentValue.toFixed(decimals) + extractedSuffix);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericValue.toFixed(decimals) + extractedSuffix);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value, duration, prefix, suffix, decimals]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {prefix}{displayValue}
    </motion.span>
  );
};

export default AnimatedCounter;
