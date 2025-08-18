import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Axone Finance
        'axone-accent': '#fab062', // Sandy Brown
        'axone-dark': '#011f26',   // Stellar Green
        'axone-white': {
          DEFAULT: 'rgba(255,255,255,0.9)',
          '75': 'rgba(255,255,255,0.75)',
          '60': 'rgba(255,255,255,0.6)',
        },
        'axone-black': {
          '35': 'rgba(0,0,0,0.35)',
          '20': 'rgba(0,0,0,0.2)',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(120deg, #fab062 0%, #011f26 100%)',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow': '0 0 20px rgba(250, 176, 98, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
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
      },
    },
  },
  plugins: [],
}
export default config
