/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fff5f8',
          100: '#ffe4ee',
          200: '#ffc9dd',
          300: '#ffa3c4',
          400: '#ff6fa3',
          500: '#fb4d8b',
          600: '#ec2f72',
          700: '#c81e5c',
          800: '#a31a4c',
          900: '#871a42',
        },
        mint: {
          50: '#f0fdf9',
          100: '#d9fcef',
          200: '#b4f9df',
          300: '#7ef0c8',
          400: '#43e0ac',
          500: '#1ec890',
          600: '#12a476',
          700: '#118362',
          800: '#116851',
          900: '#0f5644',
        },
        cream: {
          50: '#fffdf9',
          100: '#fff8ec',
          200: '#fff0d4',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Quicksand', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 24px -8px rgba(251, 77, 139, 0.18)',
        'soft-lg': '0 12px 40px -12px rgba(251, 77, 139, 0.25)',
        glow: '0 0 0 4px rgba(251, 77, 139, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        'mic-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(251, 77, 139, 0.4)' },
          '70%': { boxShadow: '0 0 0 18px rgba(251, 77, 139, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(251, 77, 139, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'mic-pulse': 'mic-pulse 1.5s ease-out infinite',
      },
    },
  },
  plugins: [],
};
