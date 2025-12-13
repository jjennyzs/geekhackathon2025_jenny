/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app.{vue,js,ts,jsx,tsx}",
    "./components/**/*.{vue,js,ts,jsx,tsx}",
    "./layouts/**/*.{vue,js,ts,jsx,tsx}",
    "./app/pages/**/*.{vue,js,ts,jsx,tsx}",
    "./plugins/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "M PLUS Rounded 1c",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
        ],
      },
    },
  },
  plugins: [],
};
