/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000', // Add explicit black color
        white: '#FFFFFF', // Add explicit white color
        gray: {
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        red: {
          600: '#DC2626',
          700: '#B91C1C',
        },
        primary: {
          DEFAULT: '#E50914',
          dark: '#B81D24',
          light: '#F40612',
        },
        background: {
          dark: '#141414',
          light: '#F5F5F5',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E5E5E5',
          dark: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}