/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81', // Deep Water Blue
          hover: '#0C3E6B',
          light: '#E6EFF7',
        },
        secondary: {
          DEFAULT: '#1597D4', // Aqua Blue
          hover: '#1282B8',
          light: '#E8F5FB',
        },
        accent: {
          DEFAULT: '#22B8CF', // Cyan
          light: '#E8F8FA',
        },
        bgMain: '#F5F8FB',
        surface: '#FFFFFF',
        textPrimary: '#172033',
        textSecondary: '#64748B',
        textMuted: '#94A3B8',
        border: '#E2E8F0',
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
          DEFAULT: '#2563EB',
          light: '#DBEAFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06)',
        cardHover: '0 4px 12px rgba(15, 23, 42, 0.08)',
        dropdown: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
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
}
