import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import SectionTitle from '../ui/SectionTitle';
import GlassCard from '../ui/GlassCard';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      icon: Wallet,
      title: 'Connect',
      description: 'Connectez votre wallet et accédez à la plateforme Axone en quelques clics.',
      details: 'Support complet des wallets populaires avec une interface intuitive.'
    },
    {
      icon: TrendingUp,
      title: 'Invest',
      description: 'Choisissez votre stratégie d\'investissement et investissez en un clic.',
      details: 'Sélection d\'indices optimisés et rebalancing automatique 24/7.'
    },
    {
      icon: DollarSign,
      title: 'Redeem',
      description: 'Retirez vos gains à tout moment avec une liquidité maximale.',
      details: 'Sortie instantanée et transparente de vos investissements.'
    }
  ];

  return (
    <section id="how-it-works" className="section-padding relative">
      <div className="container-custom">
        <SectionTitle
          title="Comment ça marche"
          subtitle="Trois étapes simples pour commencer votre voyage d'investissement Web3"
          className="mb-16"
        />

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-axone-accent via-axone-accent to-axone-accent opacity-30 transform -translate-y-1/2" />
          
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-axone-accent rounded-full flex items-center justify-center text-axone-dark font-bold text-sm z-10">
                  {index + 1}
                </div>

                <GlassCard className="pt-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-axone-accent rounded-full flex items-center justify-center mx-auto mb-6">
                      <step.icon size={32} className="text-axone-dark" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-axone-white mb-3">
                      {step.title}
                    </h3>
                    
                    <p className="text-axone-white-75 mb-4 leading-relaxed">
                      {step.description}
                    </p>
                    
                    <p className="text-sm text-axone-white-60 leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </GlassCard>

                {/* Arrow between steps */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                    <ArrowRight size={24} className="text-axone-accent" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-axone-white mb-4">
              Prêt à commencer ?
            </h3>
            <p className="text-axone-white-75 mb-6">
              Rejoignez des milliers d'investisseurs qui ont déjà choisi Axone pour diversifier 
              leur portefeuille Web3 de manière intelligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary">
                Commencer maintenant
              </button>
              <button className="btn-secondary">
                Voir la démo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
