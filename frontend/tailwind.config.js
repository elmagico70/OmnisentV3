/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'omni-bg': '#0a0a0a',
        'omni-surface': '#1a1a1a',
        'omni-surface2': '#242424',
        'omni-border': '#2a2a2a',
        'omni-text': '#e0e0e0',
        'omni-textDim': '#888888',
        'omni-cyan': '#00D9FF',
        'omni-cyanDim': '#0099BB',
        'omni-green': '#00FF88',
        'omni-greenDim': '#00AA55',
        'omni-red': '#FF0044',
        'omni-redDim': '#AA0022',
        'omni-yellow': '#FFD700',
        'omni-purple': '#BB00FF',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' },
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '20px 20px',
      },
    },
  },
  plugins: [],
};
