import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        brand: {
          50: "#f6f7f3",
          100: "#e8ebe0",
          200: "#cfd5bd",
          300: "#aeb893",
          400: "#8c9a6b",
          500: "#6f8050",
          600: "#56663c",
          700: "#425031",
          800: "#374129",
          900: "#2f3825",
          950: "#181d12",
        },
        accent: {
          50: "#fbf7ef",
          100: "#f4ead4",
          200: "#e8d3a5",
          300: "#dbb56e",
          400: "#cf9a45",
          500: "#bf8432",
          600: "#a06827",
          700: "#7d4f23",
          800: "#5f3d21",
          900: "#4a311c",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
