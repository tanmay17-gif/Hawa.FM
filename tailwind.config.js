/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radio: {
          dark: '#121316',
          mid: '#1d1f24',
          light: '#2b2e36',
          gold: '#d4af37',
          brass: '#8c7428',
          cream: '#f4eedd',
        }
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Righteous', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

