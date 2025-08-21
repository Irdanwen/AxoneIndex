"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useAccount, useConnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import Button from '../ui/Button';
import ThemeToggle from '../ui/ThemeToggle';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  
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
    const handleChainError = (error: { code?: number }) => {
      if (error.code === 4902) {
        alert("Chain non supportée, veuillez choisir la bonne chaîne");
      }
    };
    
    window.addEventListener('ethereum_chainChanged', handleChainError);
    return () => window.removeEventListener('ethereum_chainChanged', handleChainError);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-4 left-0 right-0 z-50 transition-all duration-500 w-full ${
        isScrolled 
          ? 'bg-axone-dark/20 backdrop-blur-sm border-b border-white-pure/10 dark:bg-axone-dark/20 dark:border-white-pure/10' 
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
              className="w-20 h-20 rounded-full bg-white-10 flex items-center justify-center relative overflow-hidden"
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
            <span className="text-xl font-bold text-axone-dark dark:text-white-pure tracking-tight">Axone</span>
          </motion.div>

          {/* Navigation à droite */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-4"
          >
            <ThemeToggle />
            <Button 
              variant="secondary" 
              size="md"
              href="/documentation"
              className="text-axone-dark dark:text-white-pure hover:text-axone-accent"
            >
              <span>Documentation</span>
            </Button>
            <Button 
              variant="secondary" 
              size="md"
              href="/referral-management"
              className="text-axone-dark dark:text-white-pure hover:text-axone-accent"
            >
              <span>Gestion</span>
            </Button>
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="secondary"
                  size="md"
                  onClick={() => switchChain({ chainId: 998 })}
                  disabled={isPending}
                >
                  {isPending ? 'Changement...' : 'Basculer vers HyperEVM'}
                </Button>
                <span className="text-axone-dark dark:text-white-pure px-3 py-1 rounded-lg bg-white-10 dark:bg-axone-dark-light">
                  {address?.slice(0,6)}...{address?.slice(-4)}
                </span>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="md"
                onClick={() => connect({ connector: injected() })}
                className="flex items-center space-x-2"
              >
                <span>Connecter Wallet</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </motion.div>

        </div>
      </div>
    </motion.header>
  );
};

export default Header;
