/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
           primary: {
          /* Rebrand to green primary */
          50: '#edf7f2',
          100: '#d8efe5',
          200: '#b5e0cc',
          300: '#86c7aa',
          400: '#4aa880',
          500: '#2a8d67',
          600: '#1f7b58',
          700: '#19613e', /* requested */
          800: '#124a2f',
          900: '#0c3322',
        },
        success: { 50: '#f0fdf4', 500: '#22c55e' },
        error: { 50: '#fef2f2', 500: '#ef4444' },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease forwards',
      },
    },
  },
  plugins: [],
}
