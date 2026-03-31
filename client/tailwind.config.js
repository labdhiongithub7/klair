/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#faf9f7',
          100: '#f3f1ed',
          200: '#e8e4dd',
          300: '#d4cfc6',
          400: '#9b958a',
          500: '#7a746a',
          600: '#5e5952',
          700: '#46423d',
          800: '#2e2b28',
          900: '#1a1816',
        },
        blue: {
          50: '#eef4ff',
          100: '#dbe8fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#6090fa',
          500: '#5b8af5',
          600: '#4a72d9',
          700: '#3a5db8',
        },
        purple: {
          50: '#f5f0ff',
          100: '#ede5ff',
          300: '#c4a8ff',
          400: '#a78bfa',
          500: '#9775e6',
          600: '#7c5cc7',
          700: '#6447a8',
        },
        teal: {
          50: '#effef8',
          100: '#d5fbea',
          300: '#7ae8c1',
          400: '#4dd8a5',
          500: '#2ec08d',
          600: '#22a07a',
        },
        rose: {
          50: '#fff1f3',
          100: '#ffe0e5',
          300: '#ffa0b4',
          400: '#fb7185',
          500: '#f43f5e',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};