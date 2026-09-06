import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fbf0',
          100: '#dcf5dd',
          200: '#bce8c0',
          300: '#8fd697',
          400: '#5cbd69',
          500: '#3aa049',
          600: '#1f7a30',
          700: '#155f26',
          800: '#0a4719',
          900: '#004d16',
          950: '#003b10',
        },
        ink: {
          50: '#edffec',
          100: '#e3f7df',
          200: '#c9ecc5',
          300: '#a4e8ad',
          400: '#6fbf7d',
          500: '#3f8f52',
          600: '#2c6b3f',
          700: '#1c4a2e',
          800: '#113320',
          900: '#002d0c',
        },
        accent: {
          50: '#fff4ec',
          100: '#ffe6d3',
          200: '#ffc9a1',
          300: '#ffa86b',
          400: '#ff8740',
          500: '#ff6900',
          600: '#e05c00',
          700: '#b84a00',
        },
        mint: '#edffec',
        leaf: '#a4e8ad',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        lift: '0 10px 30px -12px rgb(0 0 0 / 0.25)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
