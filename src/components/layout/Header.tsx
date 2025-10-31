"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { injected } from 'wagmi/connectors';
import ThemeToggle from '../ui/ThemeToggle';
import { useToast } from '../ui/use-toast';

const Header: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobileAccountMenuOpen, setIsMobileAccountMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [preferMobileNav, setPreferMobileNav] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('preferMobileNav') === 'true';
  });
  const [mobilePromptDismissed, setMobilePromptDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mobilePromptDismissed') === 'true';
  });
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  // wagmi
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();
  const { toast, toasts, dismiss } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const updateViewport = (event: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    updateViewport(mediaQuery);
    const handler = (event: MediaQueryListEvent) => updateViewport(event);
    mediaQuery.addEventListener('change', handler);
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  const shouldUseMobileNav = preferMobileNav && isMobileViewport;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Body scroll lock + Esc pour fermer le drawer
  useEffect(() => {
    if (!shouldUseMobileNav) {
      document.body.style.overflow = 'unset';
      return;
    }

    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setIsMobileAccountMenuOpen(false);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
        setIsMobileAccountMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen, shouldUseMobileNav]);

  useEffect(() => {
    if (!isMobileViewport) {
      setIsMobileOpen(false);
      setPreferMobileNav(false);
      setShowMobilePrompt(false);
      document.body.style.overflow = 'unset';
      return;
    }

    const savedPreference = typeof window !== 'undefined' ? localStorage.getItem('preferMobileNav') : null;
    if (savedPreference === 'true') {
      setPreferMobileNav(true);
      setShowMobilePrompt(false);
      return;
    }

    if (!preferMobileNav && !mobilePromptDismissed) {
      setShowMobilePrompt(true);
    }
  }, [isMobileViewport, mobilePromptDismissed, preferMobileNav]);

  useEffect(() => {
    if (!shouldUseMobileNav) {
      setIsMobileOpen(false);
      setIsMobileAccountMenuOpen(false);
    }
  }, [shouldUseMobileNav]);

  const navLinks = [
    { href: '/documentation', label: 'Documentation' },
    { href: '/market', label: 'Market' },
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

  useEffect(() => {
    if (preferMobileNav) {
      setShowMobilePrompt(false);
    }
  }, [preferMobileNav]);

  useEffect(() => {
    if (!isAccountMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAccountMenuOpen]);

  useEffect(() => {
    if (isAccountMenuOpen) {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsAccountMenuOpen(false);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }
  }, [isAccountMenuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-axone-dark/90 backdrop-blur-lg transition-shadow ${
          isScrolled ? 'shadow-sm' : ''
        }`}
        role="banner"
        aria-label="Navigation principale"
      >
        <div className="grid h-16 w-full max-w-full grid-cols-[auto,1fr,auto] items-center gap-6 px-4 sm:px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 max-w-full">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3L21 12L12 21L3 12L12 3Z" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-lg font-semibold text-slate-900">Axone Finance</span>
          </Link>

          {/* Nav desktop */}
          <nav
            className={`${shouldUseMobileNav ? 'hidden' : 'block'} lg:block`}
            role="navigation"
            aria-label="Menu principal"
          >
            <ul className="header-nav list-none">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`relative inline-flex items-center pb-1 text-sm font-semibold transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-900 after:transition-opacity ${
                        active
                          ? 'text-slate-900 after:opacity-100'
                          : 'text-slate-600 hover:text-slate-900 after:opacity-0 hover:after:opacity-100'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions droites */}
          <div className="flex items-center justify-end gap-3">
            <ThemeToggle />
            <div className={`${shouldUseMobileNav ? 'hidden' : 'flex'} items-center gap-3 lg:flex`}>
              {isConnected ? (
                <>
                  <button
                    onClick={handleSwitch}
                    disabled={isPending}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isPending ? 'Changement…' : 'HyperEVM'}
                  </button>
                  <div className="relative" ref={accountMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen((open) => !open)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      aria-haspopup="menu"
                      aria-expanded={isAccountMenuOpen}
                    >
                      <Wallet className="h-4 w-4" aria-hidden="true" />
                      <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    </button>
                    {isAccountMenuOpen ? (
                      <div
                        role="menu"
                        aria-label="Options du wallet"
                        className="absolute right-0 top-full z-50 mt-2 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            disconnect();
                            setIsAccountMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                          Déconnecter
                        </button>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  Connect Wallet
                </button>
              )}
            </div>
            {shouldUseMobileNav ? (
              <button
                onClick={() => setIsMobileOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 p-2 text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 lg:hidden"
                aria-label="Menu de navigation"
                aria-expanded={isMobileOpen}
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Menu</span>
                <motion.div animate={{ rotate: isMobileOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                  {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </motion.div>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {showMobilePrompt ? (
        <div className="fixed inset-x-0 top-16 z-40 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Essayez notre navigation adaptée au mobile</p>
                <p>
                  Nous avons détecté que vous utilisez un écran plus petit. Souhaitez-vous passer à la navigation mobile optimisée ?
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setPreferMobileNav(true);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('preferMobileNav', 'true');
                        localStorage.setItem('mobilePromptDismissed', 'false');
                      }
                      setShowMobilePrompt(false);
                      setMobilePromptDismissed(false);
                      if (!isMobileOpen) {
                        setIsMobileOpen(true);
                      }
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:w-auto"
                  >
                    Passer en version mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferMobileNav(false);
                      setMobilePromptDismissed(true);
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('preferMobileNav', 'false');
                        localStorage.setItem('mobilePromptDismissed', 'true');
                      }
                      setShowMobilePrompt(false);
                      setIsMobileOpen(false);
                      setIsMobileAccountMenuOpen(false);
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 sm:w-auto"
                  >
                    Rester en version desktop
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile Drawer */}
      {shouldUseMobileNav ? (
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute right-0 top-0 h-full w-full max-w-sm bg-white text-slate-900 shadow-xl"
              id="mobile-menu"
              role="navigation"
              aria-label="Menu principal mobile"
            >
              <div className="flex h-full flex-col gap-8 overflow-auto px-6 pb-10 pt-24">
                <nav>
                  <ul className="space-y-2 text-lg font-semibold">
                    {navLinks.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`block rounded-md px-2 py-2 transition-colors ${
                            isActive(link.href) ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="mt-auto space-y-4">
                  {isConnected ? (
                    <>
                      <button
                        onClick={handleSwitch}
                        disabled={isPending}
                        className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isPending ? 'Changement…' : 'HyperEVM'}
                      </button>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMobileAccountMenuOpen((open) => !open)}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          aria-haspopup="menu"
                          aria-expanded={isMobileAccountMenuOpen}
                        >
                          <Wallet className="h-4 w-4" aria-hidden="true" />
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </button>
                        {isMobileAccountMenuOpen ? (
                          <div
                            role="menu"
                            aria-label="Options du wallet mobile"
                            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                disconnect();
                                setIsMobileAccountMenuOpen(false);
                                setIsMobileOpen(false);
                              }}
                              className="flex w-full items-center justify-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              <LogOut className="h-4 w-4" aria-hidden="true" />
                              Déconnecter
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleConnect();
                        setIsMobileOpen(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    >
                      <Wallet className="h-5 w-5" aria-hidden="true" />
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </motion.nav>
          </motion.div>
          )}
        </AnimatePresence>
      ) : null}

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
