/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        bg: {
          base:     'var(--color-bg-base)',
          surface:  'var(--color-bg-surface)',
          card:     'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
          border:   'var(--color-bg-border)',
        },
        neon: {
          green: '#FF6535',
          dim:   '#CC4A20',
          glow:  '#FF653533',
        },
        ink: {
          primary:   'var(--color-ink-primary)',
          secondary: 'var(--color-ink-secondary)',
          muted:     'var(--color-ink-muted)',
        },
        score: {
          eagle:  '#7c3aed',
          birdie: '#FF6535',
          par:    '#FFFFFF',
          bogey:  '#f59e0b',
          double: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
