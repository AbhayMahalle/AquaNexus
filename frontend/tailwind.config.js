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
          DEFAULT: '#0F4C81',
          hover: '#0C3E6B',
          light: '#E6EFF7',
        },
        secondary: {
          DEFAULT: '#1597D4',
          hover: '#127FB4',
          light: '#EAF6FC',
        },
        accent: {
          DEFAULT: '#22B8CF',
          hover: '#1BA0B5',
          light: '#EAF8FA',
        },
        surface: '#FFFFFF',
        background: '#F5F8FB',
        text: {
          primary: '#172033',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          dark: '#CBD5E1',
        },
        status: {
          success: '#16A34A',
          warning: '#F59E0B',
          danger: '#DC2626',
          info: '#2563EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'sm': '6px',
        'DEFAULT': '8px',
        'md': '8px',
        'card': '12px',
        'lg': '14px',
      },
      boxShadow: {
        'erp': '0 1px 3px rgba(15, 23, 42, 0.06)',
        'erp-hover': '0 4px 12px rgba(15, 23, 42, 0.08)',
        'erp-modal': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
