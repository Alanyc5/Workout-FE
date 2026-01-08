/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F4F4F', // Dark Slate Gray (墨綠)
        destructive: '#B22222', // Firebrick (暗紅)
      }
    },
  },
  plugins: [],
}
