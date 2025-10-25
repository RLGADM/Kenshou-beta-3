/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 2.5s linear infinite',
        'ping-custom': 'ping-custom 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
        orbital: 'orbit 2s linear infinite',
      },
      keyframes: {
        'ping-custom': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(32px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(32px) rotate(-360deg)' },
        },
      },
    },
  },
  plugins: [],
};
