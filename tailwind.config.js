/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dreeso-dark': {
          50: '#f5f5f6',
          100: '#e6e6e7',
          200: '#cfcfd2',
          300: '#adadb2',
          400: '#84848b',
          500: '#696970',
          600: '#5a5a5f',
          700: '#4c4c50',
          800: '#434346',
          900: '#3b3b3d',
          950: '#1a1a1c',
          DEFAULT: '#1a1a1c',
        },
        'dreeso-accent': {
          50: '#edfcf2',
          100: '#d3f8df',
          200: '#aaf0c4',
          300: '#73e2a3',
          400: '#3bcd7e',
          500: '#17b363',
          600: '#0b914f',
          700: '#097441',
          800: '#0a5c36',
          900: '#094b2d',
          950: '#042a1a',
          DEFAULT: '#17b363',
        },
        semantic: {
          success: '#06c167',
          warning: '#ffc043',
          error: '#e11900',
          info: '#276ef1',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.12)',
          hover: 'rgba(255, 255, 255, 0.15)',
        },
      },
      fontFamily: {
        sans: ['"UberMove"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"UberMoveMono"', '"Fira Code"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.24)',
        'glass-lg': '0 12px 48px 0 rgba(0, 0, 0, 0.48)',
        'accent-glow': '0 0 20px rgba(23, 179, 99, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-green': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(23, 179, 99, 0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 10px rgba(23, 179, 99, 0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-up': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-green': 'pulse-green 2s ease-in-out infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'scale-up': 'scale-up 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};