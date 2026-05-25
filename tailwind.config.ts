import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        portal: {
          ink: '#16362f',
          moss: '#1c5644',
          gold: '#d47b10',
          paper: '#f5f7f6',
          line: 'rgba(71, 101, 93, 0.14)'
        }
      },
      boxShadow: {
        soft: '0 24px 80px rgba(18, 46, 36, 0.12)'
      },
      borderRadius: {
        xl2: '1.5rem',
        xl3: '2rem'
      }
    }
  },
  plugins: []
};

export default config;