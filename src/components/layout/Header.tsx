"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { GlowButton } from '../ui/GlowButton';
import ThemeToggle from '../ui/ThemeToggle';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Hooks wagmi pour la gestion du wallet
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { switchChain, isPending } = useSwitchChain();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestionnaire d'erreur pour les changements de chaîne
  useEffect(() => {
    const handleChainError = (event: Event) => {
      const error = event as { code?: number };
      if (error.code === 4902) {
        alert("Chain non supportée, veuillez choisir la bonne chaîne");
      }
    };
    
    window.addEventListener('ethereum_chainChanged', handleChainError);
    return () => window.removeEventListener('ethereum_chainChanged', handleChainError);
  }, []);
  
  // Fermer le menu mobile lors de la navigation
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);
  
  const navLinks = [
    { href: '/documentation', label: 'Documentation' },
    { href: '/vaults', label: 'Vaults' },
    { href: '/referral', label: 'Parrainage' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'glass-cosmic-dark border-b border-white/10' 
            : 'bg-transparent'
        }`}
        role="banner"
        aria-label="Navigation principale"
      >
        <div className="w-full max-w-screen-2xl mx-auto px-4 lg:px-8">
          <div className="flex items-center h-20">

            {/* Logo futuriste à gauche */}
            <motion.div
              className="flex items-center space-x-4 z-50"
              whileHover={{ scale: 1.02 }}
            >
              <Link href="/" className="flex items-center space-x-3 group">
                <motion.div 
                  className="relative w-12 h-12"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  {/* Logo animé futuriste */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-axone-accent to-axone-flounce animate-pulse-glow" />
                  <div className="absolute inset-0 rounded-full glass-cosmic flex items-center justify-center">
                    <svg className="w-8 h-8 text-white-pure" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <path 
                        d="M16 4L28 16L16 28L4 16L16 4Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                        className="animate-constellation-draw"
                      />
                      <circle 
                        cx="16" 
                        cy="16" 
                        r="6" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                        className="animate-orbit"
                      />
                      <circle cx="16" cy="16" r="2" fill="currentColor" className="animate-twinkle" />
                    </svg>
                  </div>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white-pure group-hover:text-gradient transition-all duration-300">
                    AXONE
                  </span>
                  <span className="text-xs font-medium text-axone-accent uppercase tracking-wider">
                    Finance
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Navigation centrée - Desktop */}
            <motion.nav
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex flex-1 items-center justify-center gap-8"
              role="navigation"
              aria-label="Menu principal"
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link 
                    href={link.href}
                    className="relative text-white-75 hover:text-white-pure font-medium uppercase text-sm tracking-wider transition-all duration-300 group"
                  >
                    <span>{link.label}</span>
                    <motion.div
                      className="absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-axone-accent to-axone-flounce"
                      initial={{ width: 0 }}
                      whileHover={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  </Link>
                </motion.div>
              ))}
              
              {/* Bouton Launch App central */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <GlowButton
                  variant="primary"
                  size="sm"
                  glowColor="accent"
                  className="ml-4"
                  asChild
                >
                  <Link href="/vaults">
                    <Rocket className="w-4 h-4" />
                    <span>LAUNCH APP</span>
                  </Link>
                </GlowButton>
              </motion.div>
            </motion.nav>

            {/* Section droite : Theme Toggle + Wallet + Menu */}
            <div className="flex items-center space-x-4 z-50">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Wallet Connection - Desktop */}
              <div className="hidden lg:block">
                {isConnected ? (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => switchChain({ chainId: 998 })}
                      disabled={isPending}
                      className="glass-cosmic px-4 py-2 rounded-lg text-sm font-medium text-white-75 hover:text-white-pure transition-all duration-300 border border-white/10 hover:border-axone-accent/30"
                    >
                      {isPending ? 'Changement...' : 'HyperEVM'}
                    </button>
                    <div className="glass-cosmic px-4 py-2 rounded-lg flex items-center space-x-2 border border-axone-accent/20">
                      <Wallet className="w-4 h-4 text-axone-accent" />
                      <span className="text-white-pure font-mono text-sm">
                        {address?.slice(0,6)}...{address?.slice(-4)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <GlowButton
                    variant="secondary"
                    size="sm"
                    glowColor="flounce"
                    onClick={() => connect({ connector: injected() })}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>CONNECT WALLET</span>
                  </GlowButton>
                )}
              </div>
              
              {/* Menu hamburger - Mobile */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg glass-cosmic border border-white/10 hover:border-axone-accent/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-axone-accent focus:ring-offset-2 focus:ring-offset-axone-dark"
                aria-label="Menu de navigation"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <motion.div
                  animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-white-pure" />
                  ) : (
                    <Menu className="w-6 h-6 text-white-pure" />
                  )}
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      
      {/* Menu mobile overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Menu content */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm glass-cosmic-dark border-l border-white/10"
            >
              <div className="flex flex-col p-8 pt-24 space-y-6">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-2xl font-bold text-white-pure hover:text-axone-accent transition-all duration-300 uppercase tracking-wider"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                
                {/* Launch App button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="pt-6"
                >
                  <GlowButton
                    variant="primary"
                    size="lg"
                    glowColor="accent"
                    className="w-full"
                    asChild
                  >
                    <Link href="/vaults" onClick={() => setIsMobileMenuOpen(false)}>
                      <Rocket className="w-5 h-5" />
                      <span>LAUNCH APP</span>
                    </Link>
                  </GlowButton>
                </motion.div>
                
                {/* Wallet connection - Mobile */}
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <GlowButton
                      variant="secondary"
                      size="lg"
                      glowColor="flounce"
                      className="w-full"
                      onClick={() => {
                        connect({ connector: injected() });
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Wallet className="w-5 h-5" />
                      <span>CONNECT WALLET</span>
                    </GlowButton>
                  </motion.div>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
