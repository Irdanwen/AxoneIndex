import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Twitter, Github, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    produit: [
      { label: 'Fonctionnalités', href: '#features' },
      { label: 'Comment ça marche', href: '#how-it-works' },
      { label: 'Tarifs', href: '#pricing' },
      { label: 'Documentation', href: '#docs' },
    ],
    entreprise: [
      { label: 'À propos', href: '#about' },
      { label: 'Blog', href: '#blog' },
      { label: 'Carrières', href: '#careers' },
      { label: 'Contact', href: '#contact' },
    ],
    support: [
      { label: 'Centre d\'aide', href: '#help' },
      { label: 'Communauté', href: '#community' },
      { label: 'Statut', href: '#status' },
      { label: 'Sécurité', href: '#security' },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="bg-axone-black-35 border-t border-axone-white-60">
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-axone-accent rounded-lg flex items-center justify-center">
                <span className="text-axone-dark font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-axone-white">Axone Finance</span>
            </div>
            <p className="text-axone-white-75 mb-6 max-w-md">
              La voie intelligente pour diversifier dans le Web3 — sans compromis entre simplicité et puissance.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 bg-axone-black-20 rounded-lg flex items-center justify-center text-axone-white-75 hover:text-axone-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="text-axone-white font-semibold mb-4">Produit</h4>
            <ul className="space-y-2">
              {footerLinks.produit.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-axone-white-75 hover:text-axone-accent transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-axone-white font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2">
              {footerLinks.entreprise.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-axone-white-75 hover:text-axone-accent transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-axone-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-axone-white-75 hover:text-axone-accent transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-axone-white-60 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-axone-white-60">
              © {currentYear} Axone Finance. Tous droits réservés.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#privacy" className="text-axone-white-75 hover:text-axone-accent transition-colors">
                Politique de confidentialité
              </a>
              <a href="#terms" className="text-axone-white-75 hover:text-axone-accent transition-colors">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
