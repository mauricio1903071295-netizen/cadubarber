/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        barber: {
          dark: '#141414',
          gold: '#c9a24b',
        },
      },
    },
  },
  plugins: [],
};
