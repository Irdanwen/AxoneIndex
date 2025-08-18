"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Button from '../ui/Button';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Explore', href: '#explore' },
    { label: 'Participate', href: '#participate' },
    { label: 'Build', href: '#build' },
    { label: 'Upgrade Hub', href: '#upgrade' },
    { label: 'FAQs', href: '#faqs' },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-black/20 backdrop-blur-sm border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="container-custom relative">
        <div className="flex items-center justify-between h-20 max-w-7xl mx-auto px-md">
          <div className="flex items-center space-x-xl">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center space-x-3 group cursor-pointer"
            >
              {/* Logo Axone */}
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden bg-white/10"
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

            {/* Navigation horizontale simplifiée */}
            <nav className="hidden lg:flex items-center space-x-lg">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-white-75 hover:text-axone-accent transition-colors duration-300 
                             font-medium text-sm tracking-wider relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-axone-accent 
                                 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>
          </div>

          <div className="hidden lg:block">
            <Button variant="primary" size="md" className="px-lg py-md">
              <span className="font-medium">Launch App</span>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg transition-all duration-200 bg-white/10 hover:bg-white/20 border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Menu de navigation"
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} className="text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} className="text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile menu simplifié */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-axone-dark-lighter 
                         border-t border-white-10 py-sm px-md space-y-xs">
            {navItems.map(item => (
              <a key={item.label} href={item.href} 
                 className="block text-white-75 hover:text-axone-accent transition-colors">
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;
