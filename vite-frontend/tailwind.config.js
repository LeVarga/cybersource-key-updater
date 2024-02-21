/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        red: "#FF0019",
        white: "#FFFFFF",
        black: "#161416",
        darkGray: "#232123",
        midGray: "#343334",
        lightGray: "#CCCBCD"
      }
    },
  },
  plugins: [],
}

