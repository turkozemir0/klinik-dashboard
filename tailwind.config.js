/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        demo: {
          bg:      '#050a30',
          card:    '#080f3a',
          'card-2':'#0d1650',
          border:  '#1a2878',
          blue:    '#233dff',
          cyan:    '#42c2d5',
          text:    '#f4f6fc',
          muted:   '#5a72b0',
        },
      },
      keyframes: {
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.2' },
        },
        scan: {
          '0%':   { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        pulse_dot: 'pulse_dot 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
