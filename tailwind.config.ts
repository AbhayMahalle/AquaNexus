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
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FFF7ED',
        },
        secondary: {
          DEFAULT: '#666666',
          hover: '#444444',
          light: '#F5F5F5',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          light: '#FFF7ED',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F8F8',
          alt: '#F5F5F5',
        },
        background: {
          DEFAULT: '#F8F8F8',
          alt: '#F5F5F5',
          subtle: '#FAFAFA',
        },
        foreground: {
          DEFAULT: '#222222',
          secondary: '#666666',
          muted: '#999999',
        },
        border: {
          DEFAULT: '#E5E5E5',
          dark: '#D4D4D4',
          light: '#F0F0F0',
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
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.06), 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        dropdown: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
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
