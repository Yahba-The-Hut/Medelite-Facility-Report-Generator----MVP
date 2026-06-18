/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1a1a3e",
          purple: "#6b21a8",
          gold: "#facc15",
        },
      },
    },
  },
  plugins: [],
};
