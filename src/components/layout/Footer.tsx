"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Twitter, MessageCircle, Mail } from 'lucide-react';
import Button from '../ui/Button';

const Footer: React.FC = () => {
  const footerLinks = {
    explore: [
      { label: 'Protocol', href: '#protocol' },
      { label: 'Features', href: '#features' },
      { label: 'Roadmap', href: '#roadmap' },
      { label: 'Whitepaper', href: '#whitepaper' },
    ],
    ecosystem: [
      { label: 'Developers', href: '#developers' },
      { label: 'Partners', href: '#partners' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'API', href: '#api' },
    ],
    participate: [
      { label: 'Governance', href: '#governance' },
      { label: 'Staking', href: '#staking' },
      { label: 'Rewards', href: '#rewards' },
      { label: 'Community', href: '#community' },
    ],
    build: [
      { label: 'Documentation', href: '#docs' },
      { label: 'GitHub', href: '#github' },
      { label: 'SDK', href: '#sdk' },
      { label: 'Support', href: '#support' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#twitter', label: 'Twitter' },
    { icon: MessageCircle, href: '#discord', label: 'Discord' },
    { icon: Github, href: '#github', label: 'GitHub' },
    { icon: Mail, href: '#mail', label: 'Email' },
  ];

  return (
    <footer className="bg-axone-dark border-t border-axone-accent-20 relative overflow-hidden">
      {/* Particules de fond */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-1 h-1 bg-axone-accent rounded-full opacity-40"
          style={{ top: '20%', left: '10%' }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-axone-flounce rounded-full opacity-30"
          style={{ top: '60%', right: '15%' }}
          animate={{
            y: [0, 8, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Section principale */}
        <div className="py-16">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Colonne gauche */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Logo et branding */}
              <div className="flex items-center space-x-4 group cursor-pointer">
                <motion.div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                  style={{background: 'var(--gradient-primary)'}}
                >
                  <svg className="w-8 h-8 text-white-pure" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="16" cy="16" r="2" fill="currentColor"/>
                  </svg>
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white-pure group-hover:text-axone-accent transition-colors tracking-tight">Axone</span>
                  <span className="text-sm font-semibold text-axone-flounce">Finance</span>
                </div>
              </div>

              {/* Message principal */}
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white-pure">
                  Control what&apos;s yours with Axone
                </h3>
                <p className="text-white-75 text-lg leading-relaxed">
                  Join the future of decentralized finance. Maintain full control over your assets 
                  while earning rewards through our innovative protocol.
                </p>
              </div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Button 
                  variant="primary" 
                  size="lg" 
                  href="/referral"
                  className="btn-with-icon hover:shadow-glow transition-all duration-300"
                >
                  Launch App
                  <ArrowRight className="w-5 h-5 btn-icon" />
                </Button>
              </motion.div>

              {/* Social Links */}
              <div className="flex space-x-4 pt-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -3, scale: 1.1 }}
                    className="w-12 h-12 glass-card rounded-xl flex items-center justify-center border border-axone-accent-20 hover:border-axone-accent transition-all duration-300 group"
                  >
                    <social.icon className="w-5 h-5 text-white-pure group-hover:text-axone-accent transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Colonne droite - Liens organisés */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-lg font-bold text-white-pure capitalize">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {links.map((link, linkIndex) => (
                      <motion.li
                        key={link.label}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + categoryIndex * 0.1 + linkIndex * 0.05 }}
                        viewport={{ once: true }}
                      >
                        <a
                          href={link.href}
                          className="text-white-75 hover:text-axone-accent transition-colors duration-300 text-sm"
                        >
                          {link.label}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Bas de page - Mentions légales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="py-8 border-t border-axone-accent-20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white-60 text-sm">
              © 2024 Axone Finance. All rights reserved.
            </div>
            <div className="flex space-x-8">
              <a href="#terms" className="text-white-60 hover:text-axone-accent transition-colors text-sm">
                Terms of Service
              </a>
              <a href="#privacy" className="text-white-60 hover:text-axone-accent transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#cookies" className="text-white-60 hover:text-axone-accent transition-colors text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
