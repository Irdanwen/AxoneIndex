"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  centered = true,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      viewport={{ once: true }}
      className={`${centered ? 'text-center' : ''} ${className}`}
    >
      <h2 className="text-3xl md:text-4xl font-bold text-white-pure mb-4 font-poppins">
        {title}
      </h2>
      {subtitle && (
        <p className="text-lg text-white-85 max-w-2xl mx-auto leading-relaxed font-poppins">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
