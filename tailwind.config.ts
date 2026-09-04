import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0F0FE',
          200: '#BAE0FD',
          300: '#7CC4FA',
          400: '#36A5F5',
          500: '#1597D4',
          600: '#0F4C81',
          700: '#0C3C68',
          800: '#0A3052',
          900: '#082642',
        },
        primary: {
          DEFAULT: '#0F4C81',
          hover: '#0C3C68',
          light: '#E6F0FA',
        },
        secondary: {
          DEFAULT: '#1597D4',
          hover: '#117EB2',
          light: '#E8F5FC',
        },
        accent: {
          DEFAULT: '#22B8CF',
          hover: '#1BA0B5',
          light: '#E8F8FA',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
        },
        background: {
          DEFAULT: '#F5F8FB',
          alt: '#EFF3F8',
        },
        foreground: {
          DEFAULT: '#172033',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 76, 129, 0.05), 0 1px 2px 0 rgba(15, 76, 129, 0.03)',
        'card-hover': '0 4px 12px 0 rgba(15, 76, 129, 0.08), 0 2px 4px 0 rgba(15, 76, 129, 0.04)',
        dropdown: '0 10px 15px -3px rgba(15, 76, 129, 0.1), 0 4px 6px -2px rgba(15, 76, 129, 0.05)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      }
    },
  },
  plugins: [],
};
export default config;
