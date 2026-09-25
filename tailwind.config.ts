import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
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
          active: '#C2410C',
          light: '#FFF7ED',
        },
        secondary: {
          DEFAULT: '#374151',
          hover: '#1F2937',
          light: '#F3F4F6',
        },
        accent: {
          DEFAULT: '#FF6B00',
          hover: '#E05D00',
          light: '#FFF7ED',
        },
        bgMain: '#FFFFFF',
        background: {
          DEFAULT: '#FFFFFF',
          alt: '#FAFAFA',
          subtle: '#F9FAFB',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#FAFAFA',
          alt: '#F3F4F6',
        },
        textPrimary: '#000000',
        textSecondary: '#4B5563',
        textMuted: '#6B7280',
        text: {
          primary: '#000000',
          secondary: '#4B5563',
          muted: '#6B7280',
        },
        foreground: {
          DEFAULT: '#000000',
          secondary: '#4B5563',
          muted: '#6B7280',
        },
        border: {
          DEFAULT: '#E5E7EB',
          dark: '#D1D5DB',
          light: '#F3F4F6',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          warning: '#F59E0B',
          'warning-bg': '#FFFBEB',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          info: '#374151',
          'info-bg': '#F3F4F6',
        },
        success: {
          DEFAULT: '#16A34A',
          light: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#374151',
          light: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '14px',
        card: '12px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 76, 129, 0.05)',
        card: '0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 4px 12px rgba(15, 76, 129, 0.08)',
        cardHover: '0 4px 12px rgba(15, 76, 129, 0.08)',
        dropdown: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
        erp: '0 1px 3px rgba(15, 23, 42, 0.06)',
        'erp-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'erp-modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      animation: {
        fadeInUp: 'fadeInUp 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;