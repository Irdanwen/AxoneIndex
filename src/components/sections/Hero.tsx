import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import Button from '../ui/Button';

const Hero: React.FC = () => {
  const features = [
    { icon: TrendingUp, text: 'Diversification intelligente' },
    { icon: Shield, text: 'Transparence totale' },
    { icon: Zap, text: 'Performance optimisée' },
  ];

  return (
    <section id="home" className="min-h-screen flex items-center relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-hero-gradient" />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-axone-black-20" />
      
      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-soft mb-6"
            >
              Axone –{' '}
              <span className="text-gradient">The smart way</span>
              <br />
              to diversify
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="text-xl text-axone-white-75 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0"
            >
              Dans un monde où les opportunités Web3 se multiplient à une vitesse vertigineuse, 
              investir devient à la fois plus prometteur… et plus complexe.
            </motion.p>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8"
            >
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-axone-white-75">
                  <feature.icon size={20} className="text-axone-accent" />
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button variant="primary" size="lg" className="group">
                Commencer maintenant
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="secondary" size="lg">
                En savoir plus
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Column - Visual Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="glass-card p-8 relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-axone-accent rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={32} className="text-axone-dark" />
                  </div>
                  <h3 className="text-2xl font-bold text-axone-white mb-2">
                    Portefeuille Diversifié
                  </h3>
                  <p className="text-axone-white-75 mb-6">
                    Accédez à une sélection optimisée d'actifs Web3
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-axone-accent">15+</div>
                      <div className="text-sm text-axone-white-60">Actifs inclus</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-axone-accent">24/7</div>
                      <div className="text-sm text-axone-white-60">Rebalancing</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 w-8 h-8 bg-axone-accent rounded-full opacity-80"
              />
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-axone-accent rounded-full opacity-60"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
