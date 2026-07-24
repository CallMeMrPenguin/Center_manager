/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#121824",
        cardBg: "#1E2640",
        inputBg: "#151B2E",
        navyBtn: "#1B365D",
        accentRed: "#FF6B6B",
        textLight: "#F0F4F8",
        textMuted: "#9CA3AF",
      }
    },
  },
  plugins: [],
}
