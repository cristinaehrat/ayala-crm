/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:    '#0D1F3C',
        navy2:   '#1A3A6B',
        orange:  '#F97316',
        orange2: '#FB923C',
        muted:   '#94A3B8',
        'gray-light': '#F1F5F9',
        footer:  '#08111F',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
      },
      keyframes: {
        pulse_orange: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
      },
      animation: {
        'pulse-orange': 'pulse_orange 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
