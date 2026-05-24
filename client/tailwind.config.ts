import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminid: {
          DEFAULT: '#f97316',
          dark: '#c2410c',
        },
        automaton: {
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
        illuminate: {
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        superearth: {
          DEFAULT: '#eab308',
          dark: '#a16207',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
