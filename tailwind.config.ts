import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palette Axone Finance
        'axone-accent': '#fab062',
        'axone-flounce': '#4a8c8c',
        'axone-dark': '#011f26',
        'axone-light': '#f8f9fa',
        'axone-light-secondary': '#e9ecef',
        'axone-accent-light': '#fbbf7a',
        'axone-accent-dark': '#e89a4a',
        'axone-flounce-light': '#5ba3a3',
        'axone-flounce-dark': '#3a7171',
        'axone-dark-light': '#02323a',
        'white-pure': '#f8f8f8',
        'success': '#3CD88C',
        'alert': '#FFB020',
        'error': '#FF5C5C',
        'info': '#4D9FFF',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #fab062 0%, #4a8c8c 50%, #011f26 100%)',
        'gradient-primary': 'linear-gradient(135deg, #fab062 0%, #4a8c8c 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #4a8c8c 0%, #011f26 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(250, 176, 98, 0.08) 0%, rgba(74, 140, 140, 0.08) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
