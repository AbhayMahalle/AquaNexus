import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0F4C81',
          secondary: '#1597D4',
          accent: '#22B8CF',
          bg: '#F5F8FB',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: {
            primary: '#172033',
            secondary: '#64748B',
            muted: '#94A3B8',
          },
          status: {
            success: '#16A34A',
            warning: '#F59E0B',
            danger: '#DC2626',
            info: '#2563EB',
          },
        },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '14px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(15, 23, 42, 0.06)',
        hover: '0 4px 12px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
