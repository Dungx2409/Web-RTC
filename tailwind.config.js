/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meet-dark': '#202124',
        'meet-darker': '#171717',
        'meet-gray': '#3c4043',
        'meet-light-gray': '#5f6368',
        'meet-blue': '#8ab4f8',
        'meet-blue-hover': '#aecbfa',
        'meet-green': '#34a853',
        'meet-yellow': '#fbbc04',
        'meet-red': '#ea4335',
      },
      boxShadow: {
        'meet': '0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15)',
        'meet-hover': '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)',
      }
    },
  },
  plugins: [],
}
