import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad PAWVET — "Huella Amiga"
        paw: {
          50: '#f0faf5',
          100: '#d8f3e5',
          500: '#1f9d6b',
          600: '#177f56',
          700: '#126546',
          900: '#0a3d2b',
        },
        clay: '#e8734a',
        ink: '#15211c',
      },
    },
  },
  plugins: [],
};

export default config;
