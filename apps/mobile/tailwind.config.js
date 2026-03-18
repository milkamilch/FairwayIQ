/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#07070f',
          surface: '#0f0f1a',
          card: '#14141f',
          elevated: '#1c1c2e',
          border: '#252535',
        },
        neon: {
          green: '#00e87a',
          dim: '#00a855',
          glow: '#00e87a33',
        },
        ink: {
          primary: '#f0f0ff',
          secondary: '#8888aa',
          muted: '#44445a',
        },
        score: {
          eagle: '#7c3aed',
          birdie: '#00e87a',
          par: '#f0f0ff',
          bogey: '#f59e0b',
          double: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
