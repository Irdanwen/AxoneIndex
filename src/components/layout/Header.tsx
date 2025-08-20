"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 w-full ${
        isScrolled 
          ? 'bg-black/20 backdrop-blur-sm border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="w-[98%] mx-auto px-6">
        <div className="flex items-center justify-between h-20 w-full">
          
          {/* Logo et nom à gauche */}
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center relative overflow-hidden"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Image 
                src="/core_logo.png" 
                alt="Axone Logo" 
                width={64}
                height={64}
                className="object-contain"
              />
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight">Axone</span>
          </motion.div>

          {/* Navigation à droite */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-4"
          >
            <Button 
              variant="secondary" 
              size="md"
              href="/referral-management"
              className="text-white hover:text-axone-accent"
            >
              <span>Gestion</span>
            </Button>
            <Button 
              variant="primary" 
              size="md"
              href="/referral"
              className="flex items-center space-x-2"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

        </div>
      </div>
    </motion.header>
  );
};

export default Header;
