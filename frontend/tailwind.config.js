/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './utils/**/*.{js,jsx}',
    './store/**/*.{js,jsx}',
  ],
  darkMode: 'class', // 다크모드 지원
  theme: {
    extend: {},
  },
  plugins: [],
}; 