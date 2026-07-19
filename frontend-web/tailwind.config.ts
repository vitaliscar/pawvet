import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad PAWVET — "Huella Amiga" (paleta refinada)
        paw: {
          50: '#effaf4',
          100: '#d7f4e3',
          200: '#b2e8cc',
          300: '#7fd5ae',
          400: '#4abb8b',
          500: '#16a06a',
          600: '#0f8557',
          700: '#0d6a47',
          800: '#0c5439',
          900: '#0a452f',
          950: '#052e1f',
        },
        clay: {
          50: '#fef5f0',
          100: '#fde7db',
          200: '#facdb6',
          300: '#f6aa86',
          400: '#f0703f',
          500: '#e85a28',
          600: '#d9451c',
          700: '#b43419',
          800: '#902c1b',
          900: '#742819',
        },
        cream: '#faf8f4',
        ink: '#122019',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(18 32 25 / 0.04), 0 4px 16px -4px rgb(18 32 25 / 0.08)',
        lifted: '0 8px 32px -8px rgb(18 32 25 / 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
