"use client";

import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

const Stat: React.FC<StatProps> = ({
  label,
  value,
  suffix = '',
  prefix = '',
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
      className={`text-center ${className}`}
    >
      <div className="text-sm text-axone-white-70 uppercase tracking-wide mb-2">
        {label}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-axone-white">
        <AnimatedCounter 
          value={`${prefix}${value}${suffix}`} 
        />
      </div>
    </motion.div>
  );
};

export default Stat;
