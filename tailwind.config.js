/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dce8ff",
          500: "#3c82f6",
          700: "#1f57c8",
        },
      },
      boxShadow: {
        soft: "0 6px 24px rgba(17, 24, 39, 0.08)",
      },
    },
  },
  plugins: [],
};
