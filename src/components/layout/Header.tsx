"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, ChevronDown } from 'lucide-react';
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
    { label: 'Explore', href: '#explore', hasDropdown: true },
    { label: 'Participate', href: '#participate', hasDropdown: true },
    { label: 'Build', href: '#build', hasDropdown: true },
    { label: 'MKR to SKY Upgrade Hub', href: '#upgrade', hasDropdown: false },
    { label: 'FAQs', href: '#faqs', hasDropdown: false },
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
        <div className="flex items-center justify-between h-20">
          {/* Logo Axone */}
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
              <img 
                src="/core_logo.png" 
                alt="Axone Logo" 
                className="w-16 h-16 object-contain max-w-full max-h-full"
                style={{ width: '64px', height: '64px' }}
              />
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight">Axone</span>
          </motion.div>

          {/* Desktop Navigation - En ligne */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                className="relative group"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <a
                  href={item.href}
                  className="flex items-center space-x-1 text-white hover:text-blue-300 transition-colors duration-200 font-medium text-sm"
                >
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                  )}
                </a>
                {/* Ligne de soulignement au hover */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300 ease-out"></div>
              </motion.div>
            ))}
          </nav>

          {/* Bouton "Launch App" */}
          <div className="hidden lg:block">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Button 
                variant="primary" 
                size="md" 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 transition-all duration-200"
              >
                <span className="flex items-center space-x-2">
                  <span>Launch App</span>
                  <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-black" />
                  </div>
                </span>
              </Button>
            </motion.div>
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-black/20 backdrop-blur-sm border-t border-white/10 mt-2 rounded-lg overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-white hover:bg-white/10 transition-colors duration-200 rounded-lg mx-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="font-medium">{item.label}</span>
                    {item.hasDropdown && (
                      <ChevronDown className="w-4 h-4 opacity-70" />
                    )}
                  </motion.a>
                ))}
                <div className="px-4 pt-4 border-t border-white/10 mt-4">
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>Launch App</span>
                      <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-black" />
                      </div>
                    </span>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
