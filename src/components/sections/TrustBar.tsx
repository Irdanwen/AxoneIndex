import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Globe } from 'lucide-react';

const TrustBar: React.FC = () => {
  const partners = [
    { name: 'Hyperliquid', type: 'Infrastructure' },
    { name: 'Unit', type: 'Technologie' },
    { name: 'HyperEVM', type: 'Blockchain' },
  ];

  const trustPoints = [
    {
      icon: Shield,
      title: 'Sécurisé',
      description: 'Audité et vérifié'
    },
    {
      icon: Zap,
      title: 'Rapide',
      description: 'Transactions instantanées'
    },
    {
      icon: Globe,
      title: 'Décentralisé',
      description: '100% on-chain'
    }
  ];

  return (
    <section className="py-12 border-t border-axone-white-60">
      <div className="container-custom">
        {/* Partners Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h3 className="text-lg font-semibold text-axone-white mb-2">
            Construit sur
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {partners.map((partner, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-axone-accent rounded-lg flex items-center justify-center mb-2">
                  <span className="text-axone-dark font-bold text-sm">
                    {partner.name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm font-medium text-axone-white">{partner.name}</span>
                <span className="text-xs text-axone-white-60">{partner.type}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {trustPoints.map((point, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-axone-accent rounded-lg flex items-center justify-center mx-auto mb-3">
                <point.icon size={24} className="text-axone-dark" />
              </div>
              <h4 className="text-sm font-semibold text-axone-white mb-1">
                {point.title}
              </h4>
              <p className="text-xs text-axone-white-60">
                {point.description}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Additional Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <div className="inline-flex items-center space-x-6 text-sm text-axone-white-60">
            <span>🔒 Sécurité maximale</span>
            <span>⚡ Performance optimale</span>
            <span>🌐 Accessible partout</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBar;
