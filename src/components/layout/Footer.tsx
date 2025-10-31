"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Github, 
  Twitter, 
  MessageCircle, 
  Mail,
  Rocket,
  FileText,
  Users,
  Shield,
  ExternalLink
} from 'lucide-react';
import { GlowButton } from '../ui/GlowButton';
import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  internal?: boolean;
  external?: boolean;
}

const Footer: React.FC = () => {
  const footerLinks: Record<string, FooterLink[]> = {
    Produits: [
      { label: 'Market', href: '/market', icon: Shield },
      { label: 'Dashboard', href: '/dashboard', icon: FileText },
      { label: 'Parrainage', href: '/referral', icon: Users },
      { label: 'Documentation', href: '/documentation', icon: FileText },
    ],
    Écosystème: [
      { label: 'À propos', href: '/#about', internal: true },
      { label: 'Fonctionnalités', href: '/#stars', internal: true },
      { label: 'Partenaires', href: '/#trust', internal: true },
      { label: 'Tokenomics', href: '/documentation', internal: true },
    ],
    Ressources: [
      { label: 'Guide de démarrage', href: '/documentation' },
      { label: 'FAQ', href: '/documentation#faq' },
      { label: 'API Docs', href: '/documentation#api' },
      { label: 'Smart Contracts', href: '#', external: true },
    ],
    Communauté: [
      { label: 'Twitter', href: 'https://twitter.com/axone', external: true },
      { label: 'Discord', href: 'https://discord.gg/axone', external: true },
      { label: 'GitHub', href: 'https://github.com/axone', external: true },
      { label: 'Blog', href: '#blog', external: true },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/axone', label: 'Twitter' },
    { icon: MessageCircle, href: 'https://discord.gg/axone', label: 'Discord' },
    { icon: Github, href: 'https://github.com/axone', label: 'GitHub' },
    { icon: Mail, href: 'mailto:contact@axone.finance', label: 'Email' },
  ];

  return (
    <footer className="relative bg-black overflow-hidden">
      {/* Fond animé cosmique sombre */}
      <div className="absolute inset-0">
        {/* Étoiles scintillantes */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: Math.random() * 5 + 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        {/* Gradient subtil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section principale */}
        <div className="py-20 border-b border-white/5">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Colonne gauche - Branding */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-8 max-w-lg"
            >
              {/* Logo animé futuriste */}
              <div className="flex items-center space-x-4">
                <motion.div
                  className="relative w-16 h-16"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-axone-accent to-axone-flounce animate-pulse-glow" />
                  <div className="absolute inset-0 rounded-full glass-cosmic flex items-center justify-center">
                    <svg className="w-10 h-10 text-white-pure" viewBox="0 0 32 32" fill="none">
                      <path 
                        d="M16 4L28 16L16 28L4 16L16 4Z" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        fill="none"
                      />
                      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                      <circle cx="16" cy="16" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </motion.div>
                <div>
                  <h3 className="text-3xl font-black text-white-pure">AXONE</h3>
                  <p className="text-sm text-axone-accent font-semibold uppercase tracking-wider">Finance</p>
                </div>
              </div>

              {/* Message principal */}
              <div className="space-y-6">
                <h4 className="text-2xl font-bold text-white-pure leading-tight">
                  L&apos;investissement Web3 réinventé pour une nouvelle ère financière
                </h4>
                <p className="text-white-60 leading-relaxed">
                  Axone transforme la complexité de la DeFi en une expérience simple et accessible. 
                  Rejoignez des milliers d&apos;investisseurs qui ont déjà choisi l&apos;excellence.
                </p>
              </div>

              {/* CTA principal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <GlowButton
                  variant="primary"
                  size="lg"
                  glowColor="accent"
                  className="group"
                  asChild
                >
                  <Link href="/market">
                    <Rocket className="w-5 h-5 group-hover:animate-bounce" />
                    <span>COMMENCER MAINTENANT</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </GlowButton>
              </motion.div>

              {/* Réseaux sociaux */}
              <div className="flex items-center space-x-4 pt-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -3, scale: 1.1 }}
                    className="relative group"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-axone-accent to-axone-flounce opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300" />
                    <div className="relative w-12 h-12 glass-cosmic rounded-xl flex items-center justify-center border border-white/10 group-hover:border-axone-accent/30 transition-all duration-300">
                      <social.icon className="w-5 h-5 text-white-60 group-hover:text-white-pure transition-colors" />
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Colonne droite - Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
                <div key={category} className="space-y-4">
                  <h5 className="text-lg font-bold text-white-pure">
                    {category}
                  </h5>
                  <ul className="space-y-3">
                    {links.map((link, linkIndex) => (
                      <motion.li
                        key={link.label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + categoryIndex * 0.1 + linkIndex * 0.05 }}
                        viewport={{ once: true }}
                      >
                        {link.href.startsWith('/') || link.internal ? (
                          <Link
                            href={link.href}
                            className="group flex items-center gap-2 text-white-60 hover:text-axone-accent transition-all duration-300 text-sm"
                          >
                            <span>{link.label}</span>
                            {link.icon && <link.icon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-2 text-white-60 hover:text-axone-accent transition-all duration-300 text-sm"
                          >
                            <span>{link.label}</span>
                            {link.external && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </a>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bas de page */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="py-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-white-40 text-sm">
              © {new Date().getFullYear()} Axone Finance. Tous droits réservés.
            </div>
            
            {/* Liens légaux */}
            <div className="flex items-center space-x-6">
              <a 
                href="#terms" 
                className="text-white-40 hover:text-white-60 transition-colors text-sm"
              >
                Conditions d&apos;utilisation
              </a>
              <div className="w-px h-4 bg-white/10" />
              <a 
                href="#privacy" 
                className="text-white-40 hover:text-white-60 transition-colors text-sm"
              >
                Confidentialité
              </a>
              <div className="w-px h-4 bg-white/10" />
              <a 
                href="#cookies" 
                className="text-white-40 hover:text-white-60 transition-colors text-sm"
              >
                Cookies
              </a>
            </div>
          </div>
          
          {/* Badge de sécurité */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 glass-cosmic px-4 py-2 rounded-full border border-white/5">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-xs text-white-40">
                Smart contracts audités • Protocole sécurisé • Non-custodial
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;