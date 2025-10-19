"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Rocket, Wallet, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { GlowButton } from '../ui/GlowButton';
import ThemeToggle from '../ui/ThemeToggle';
import { useToast } from '../ui/use-toast';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // wagmi
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();
  const { toast, toasts, dismiss } = useToast();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body scroll lock + Esc pour fermer le drawer
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobileOpen]);

  const navLinks = [
    { href: '/documentation', label: 'Documentation' },
    { href: '/vaults', label: 'Vaults' },
    { href: '/referral', label: 'Parrainage' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  const isActive = (href: string) => href === '/' ? pathname === href : pathname?.startsWith(href);

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() });
    } catch {
      toast({
        title: 'Wallet introuvable',
        description: 'Installez MetaMask ou utilisez Brave Wallet puis réessayez.',
      });
    }
  };

  const handleSwitch = async () => {
    try {
      await switchChain({ chainId: 998 });
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: number }).code === 4902
      ) {
        toast({
          title: 'Réseau manquant',
          description: 'Ajoutez HyperEVM Testnet (ID 998) dans votre wallet puis réessayez.',
        });
      } else {
        toast({
          title: 'Échec du changement de réseau',
          description: 'Veuillez réessayer ou vérifier votre wallet.',
        });
      }
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'supports-[backdrop-filter]:bg-black/30 backdrop-blur-xl border-b border-white/10'
            : 'bg-transparent'
        }`}
        role="banner"
        aria-label="Navigation principale"
      >
        <div className="mx-auto max-w-[1920px] w-full px-4 md:px-6 lg:px-10">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <motion.div className="flex items-center gap-3 z-50 shrink-0" whileHover={{ scale: 1.02 }}>
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div className="relative h-12 w-12" whileHover={{ rotate: 360 }} transition={{ duration: 0.8, ease: 'easeInOut' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-axone-accent to-axone-flounce opacity-90" />
                  <div className="absolute inset-0 rounded-full glass-cosmic flex items-center justify-center">
                    <svg className="h-8 w-8 text-white-pure" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="16" cy="16" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white-pure group-hover:text-gradient transition-colors">AXONE</span>
                  <span className="text-xs font-medium text-axone-accent uppercase tracking-wider">Finance</span>
                </div>
              </Link>
            </motion.div>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center justify-center" role="navigation" aria-label="Menu principal">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative uppercase text-sm tracking-wider font-medium transition-colors ${
                      isActive(link.href) ? 'text-white-pure' : 'text-white-75 hover:text-white-pure'
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-2 left-0 h-0.5 bg-gradient-to-r from-axone-accent to-axone-flounce transition-all duration-300 ${
                        isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                ))}
                <GlowButton variant="primary" size="sm" glowColor="accent" className="ml-2" asChild>
                  <Link href="/vaults">
                    <Rocket className="w-4 h-4" />
                    <span>LAUNCH APP</span>
                  </Link>
                </GlowButton>
              </div>
            </nav>

            {/* Actions droites */}
            <div className="flex items-center gap-3 z-50 shrink-0">
              <ThemeToggle />
              <div className="hidden lg:flex items-center gap-2 xl:gap-3">
                {isConnected ? (
                  <>
                    <button
                      onClick={handleSwitch}
                      disabled={isPending}
                      className="glass-cosmic px-3 xl:px-4 py-2 rounded-lg text-sm font-medium text-white-75 hover:text-white-pure transition-all duration-300 border border-white/10 hover:border-axone-accent/30 whitespace-nowrap"
                    >
                      {isPending ? 'Changement…' : 'HyperEVM'}
                    </button>
                    <div className="glass-cosmic border border-axone-accent/20 rounded-lg pl-3 pr-2 py-2 flex items-center gap-2 max-w-[280px]">
                      <Wallet className="w-4 h-4 text-axone-accent shrink-0" />
                      <span className="text-white-pure font-mono text-sm truncate">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      <button
                        onClick={() => disconnect()}
                        className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white-75 hover:text-white-pure hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
                        aria-label="Se déconnecter"
                        title="Se déconnecter"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden xl:inline">Déconnecter</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <GlowButton variant="secondary" size="sm" glowColor="flounce" onClick={handleConnect}>
                    <Wallet className="w-4 h-4" />
                    <span>CONNECT WALLET</span>
                  </GlowButton>
                )}
              </div>

              {/* Burger */}
              <button
                onClick={() => setIsMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-lg glass-cosmic border border-white/10 hover:border-axone-accent/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-axone-accent focus:ring-offset-2 focus:ring-offset-axone-dark"
                aria-label="Menu de navigation"
                aria-expanded={isMobileOpen}
                aria-controls="mobile-menu"
              >
                <motion.div animate={{ rotate: isMobileOpen ? 90 : 0 }} transition={{ duration: 0.3 }}>
                  {isMobileOpen ? <X className="w-6 h-6 text-white-pure" /> : <Menu className="w-6 h-6 text-white-pure" />}
                </motion.div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.28 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm glass-cosmic-dark border-l border-white/10"
              id="mobile-menu"
              role="navigation"
              aria-label="Menu principal mobile"
            >
              <div className="flex h-full flex-col p-8 pt-24 overflow-auto">
                {navLinks.map((link, index) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`block text-2xl font-bold transition-colors uppercase tracking-wider mb-6 ${
                        isActive(link.href) ? 'text-axone-accent' : 'text-white-pure hover:text-axone-accent'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <div className="pt-2 mb-6">
                  <GlowButton variant="primary" size="lg" glowColor="accent" className="w-full" asChild>
                    <Link href="/vaults" onClick={() => setIsMobileOpen(false)}>
                      <Rocket className="w-5 h-5" />
                      <span>LAUNCH APP</span>
                    </Link>
                  </GlowButton>
                </div>

                {isConnected ? (
                  <div className="mt-auto">
                    <div className="glass-cosmic border border-axone-accent/20 rounded-lg p-4 mb-4">
                      <div className="flex items-center mb-3">
                        <Wallet className="w-5 h-5 text-axone-accent" />
                        <span className="ml-2 font-mono text-white-pure">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSwitch}
                          disabled={isPending}
                          className="flex-1 glass-cosmic px-4 py-2 rounded-lg text-sm font-medium text-white-75 hover:text-white-pure transition-all duration-300 border border-white/10 hover:border-axone-accent/30"
                        >
                          {isPending ? 'Changement…' : 'HyperEVM'}
                        </button>
                        <button
                          onClick={() => {
                            disconnect();
                            setIsMobileOpen(false);
                          }}
                          className="flex-1 glass-cosmic px-4 py-2 rounded-lg text-sm font-medium text-white-75 hover:text-white-pure transition-colors border border-white/10 hover:border-red-400/40"
                        >
                          <span className="inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Déconnecter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto">
                    <GlowButton
                      variant="secondary"
                      size="lg"
                      glowColor="flounce"
                      className="w-full mb-6"
                      onClick={() => {
                        handleConnect();
                        setIsMobileOpen(false);
                      }}
                    >
                      <Wallet className="w-5 h-5" />
                      <span>CONNECT WALLET</span>
                    </GlowButton>
                  </div>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts - local au Header */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col items-end">
        <AnimatePresence>
          {toasts?.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mb-3 w-[320px] rounded-xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-xl"
              role="status"
              aria-live="polite"
            >
              <div className="px-4 py-3">
                {t.title ? <div className="text-sm font-semibold text-white-pure mb-1">{t.title}</div> : null}
                {t.description ? <div className="text-xs text-white-75">{t.description}</div> : null}
              </div>
              <div className="flex justify-end px-3 pb-3 -mt-2">
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-xs text-white-60 hover:text-white-pure transition-colors"
                  aria-label="Fermer la notification"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Header;
