import React from 'react';
import { motion } from 'framer-motion';
import { Target, BarChart3, Globe, Zap } from 'lucide-react';
import SectionTitle from '../ui/SectionTitle';
import GlassCard from '../ui/GlassCard';

const About: React.FC = () => {
  const missionPoints = [
    {
      icon: Target,
      title: 'Mission claire',
      description: 'Rendre l\'investissement Web3 simple, intelligent et accessible à tous.'
    },
    {
      icon: BarChart3,
      title: 'Modèle éprouvé',
      description: 'Inspiré de l\'investissement par indices traditionnel, adapté au Web3.'
    },
    {
      icon: Globe,
      title: 'Transparence totale',
      description: 'Tout se passe on-chain avec transparence, flexibilité et performance.'
    },
    {
      icon: Zap,
      title: 'Technologie avancée',
      description: 'Construit sur Hyperliquid et Unit pour une gestion décentralisée optimale.'
    }
  ];

  return (
    <section id="about" className="section-padding relative">
      <div className="container-custom">
        <SectionTitle
          title="Notre mission"
          subtitle="Axone a été conçu pour changer la donne dans l'investissement Web3"
          className="mb-16"
        />

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Mission Statement */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-axone-white mb-6">
              🎯 Notre mission : rendre l'investissement Web3 simple, intelligent et accessible à tous.
            </h3>
            
            <div className="space-y-4 text-axone-white-75 leading-relaxed">
              <p>
                Nous nous inspirons d'un modèle qui a fait ses preuves dans la finance traditionnelle : 
                l'investissement par indices. À l'image du S&P 500, les produits Axone regroupent plusieurs 
                actifs, optimisent leur répartition, et s'adaptent en continu à la réalité du marché.
              </p>
              
              <p>
                Mais ici, tout se passe on-chain, avec transparence, flexibilité et performance. 
                En construisant sur les fondations technologiques d'Hyperliquid et d'Unit, nous ouvrons 
                une nouvelle ère pour la gestion de portefeuille décentralisée : plus agile, plus liquide, 
                plus pertinente.
              </p>
              
              <p className="text-axone-accent font-semibold">
                Axone, c'est la voie intelligente pour diversifier dans le Web3 — sans compromis entre simplicité et puissance.
              </p>
            </div>
          </motion.div>

          {/* Right Column - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="glass-card p-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-axone-accent to-axone-dark rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target size={40} className="text-axone-white" />
                </div>
                <h4 className="text-xl font-semibold text-axone-white mb-4">
                  L'avenir de l'investissement
                </h4>
                <p className="text-axone-white-75 mb-6">
                  Une approche révolutionnaire qui combine la simplicité des indices traditionnels 
                  avec la puissance de la blockchain.
                </p>
                
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-axone-black-20 rounded-lg">
                    <div className="text-2xl font-bold text-axone-accent">100%</div>
                    <div className="text-sm text-axone-white-60">On-chain</div>
                  </div>
                  <div className="text-center p-4 bg-axone-black-20 rounded-lg">
                    <div className="text-2xl font-bold text-axone-accent">24/7</div>
                    <div className="text-sm text-axone-white-60">Optimisation</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mission Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {missionPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <GlassCard className="h-full">
                <div className="text-center">
                  <div className="w-12 h-12 bg-axone-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                    <point.icon size={24} className="text-axone-dark" />
                  </div>
                  <h4 className="text-lg font-semibold text-axone-white mb-2">
                    {point.title}
                  </h4>
                  <p className="text-axone-white-75 text-sm leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
