import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Synchronisation avec .dark dans globals.css
  theme: {
    extend: {
      colors: {
        // Couleurs de base Tailwind
        'black': '#000000',
        'white': '#ffffff',
        'gray': {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '800': '#1f2937',
          '900': '#111827',
        },
        'red': {
          '50': '#fef2f2',
          '100': '#fee2e2',
          '200': '#fecaca',
          '300': '#fca5a5',
          '400': '#f87171',
          '500': '#ef4444',
          '600': '#dc2626',
          '700': '#b91c1c',
          '800': '#991b1b',
          '900': '#7f1d1d',
        },
        'green': {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
        },
        'blue': {
          '50': '#eff6ff',
          '100': '#dbeafe',
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a',
        },
        'yellow': {
          '50': '#fffbeb',
          '100': '#fef3c7',
          '200': '#fde68a',
          '300': '#fcd34d',
          '400': '#fbbf24',
          '500': '#f59e0b',
          '600': '#d97706',
          '700': '#b45309',
          '800': '#92400e',
          '900': '#78350f',
        },
        
        // Palette Axone Finance complète
        'axone-accent': '#fab062',
        'axone-flounce': '#4a8c8c',
        'axone-dark': '#011f26',
        
        // Couleurs spécifiques pour les vaults
        'axone': {
          "sandy-brown": "#fab062",
          "stellar-green": "#011f26",
          "flounce": "#4a8c8c",
          risk: {
            low: "#4ade80",
            medium: "#f59e0b",
            high: "#ef4444"
          }
        },
        
        // Variations de couleurs
        'axone-accent-light': '#fbbf7a',
        'axone-accent-dark': '#e89a4a',
        'axone-flounce-light': '#5ba3a3',
        'axone-flounce-dark': '#3a7171',
        'axone-dark-light': '#02323a',
        'axone-dark-lighter': '#034a56',
        
        // Couleurs neutres améliorées
        'white-pure': '#f8f8f8',
        'axone-light': '#f8f9fa',
        'axone-light-secondary': '#e9ecef',
        
        'axone-black': {
          '20': 'rgba(0,0,0,0.2)',
        },
        
        // Couleurs fonctionnelles Axone
        'success': '#3CD88C',
        'alert': '#FFB020',
        'error': '#FF5C5C',
        'info': '#4D9FFF',
        
        // Variations pour glassmorphism
        'glass': {
          'white': 'rgba(255, 255, 255, 0.05)',
          'accent': 'rgba(250, 176, 98, 0.05)',
          'flounce': 'rgba(74, 140, 140, 0.05)',
          'dark': 'rgba(1, 31, 38, 0.05)',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #fab062 0%, #4a8c8c 50%, #011f26 100%)',
        'gradient-primary': 'linear-gradient(135deg, #fab062 0%, #4a8c8c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #4a8c8c 0%, #011f26 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(250, 176, 98, 0.08) 0%, rgba(74, 140, 140, 0.08) 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(250, 176, 98, 0.15) 0%, rgba(74, 140, 140, 0.15) 100%)',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'large': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(250, 176, 98, 0.3)',
        'glow-flounce': '0 0 20px rgba(74, 140, 140, 0.3)',
        'glow-dark': '0 0 30px rgba(1, 31, 38, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.6s ease-out',
        'bounce-in': 'bounceIn 0.8s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'text-reveal': 'textReveal 0.8s ease-out',
        'underline-slide': 'underlineSlide 0.3s ease-out',
        // Nouvelles animations cosmiques
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'meteor': 'meteor 5s linear infinite',
        'cosmic-pulse': 'cosmicPulse 4s ease-in-out infinite',
        'star-glow': 'starGlow 2s ease-in-out infinite alternate',
        'constellation-draw': 'constellationDraw 2s ease-out',
        'particle-float': 'particleFloat 15s ease-in-out infinite',
        'glow-expand': 'glowExpand 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(30px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        bounceIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(250, 176, 98, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(250, 176, 98, 0.6)',
          },
        },
        gradientShift: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        textReveal: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        underlineSlide: {
          '0%': {
            width: '0%',
          },
          '100%': {
            width: '100%',
          },
        },
        // Animations cosmiques
        twinkle: {
          '0%, 100%': {
            opacity: '0.2',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.2)',
          },
        },
        orbit: {
          '0%': {
            transform: 'rotate(0deg) translateX(150px) rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg) translateX(150px) rotate(-360deg)',
          },
        },
        meteor: {
          '0%': {
            transform: 'translate(300px, -300px)',
            opacity: '1',
          },
          '70%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translate(-300px, 300px)',
            opacity: '0',
          },
        },
        cosmicPulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.5',
          },
          '50%': {
            transform: 'scale(1.5)',
            opacity: '0.8',
          },
        },
        starGlow: {
          '0%': {
            boxShadow: '0 0 5px rgba(250, 176, 98, 0.5)',
          },
          '100%': {
            boxShadow: '0 0 20px rgba(250, 176, 98, 0.8), 0 0 40px rgba(250, 176, 98, 0.4)',
          },
        },
        constellationDraw: {
          '0%': {
            strokeDasharray: '1000',
            strokeDashoffset: '1000',
          },
          '100%': {
            strokeDashoffset: '0',
          },
        },
        particleFloat: {
          '0%, 100%': {
            transform: 'translateY(0) translateX(0)',
            opacity: '0',
          },
          '10%': {
            opacity: '1',
          },
          '90%': {
            opacity: '1',
          },
          '50%': {
            transform: 'translateY(-100px) translateX(50px)',
          },
        },
        glowExpand: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '0.6',
          },
          '50%': {
            transform: 'scale(1.2)',
            opacity: '0.3',
          },
        },
      },
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
        // Classes de padding par défaut
        '0': '0px',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
        '40': '10rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
      },
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
export default config
