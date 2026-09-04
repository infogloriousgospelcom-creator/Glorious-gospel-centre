import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

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
        ink: {
          DEFAULT: "#1a1f15",
          muted: "#56663c",
          subtle: "#8c9a6b",
        },
        surface: {
          DEFAULT: "#ffffff",
          muted: "#f6f7f3",
          inset: "#f1f2ec",
        },
        success: { 50: "#eaf6ee", 600: "#1f7a3d", 700: "#155f2f" },
        warning: { 50: "#fdf6e3", 600: "#a16207", 700: "#854d04" },
        danger:  { 50: "#fdecec", 600: "#b3261e", 700: "#8a1c17" },
        info:    { 50: "#e8f1fb", 600: "#1d6fb8", 700: "#155689" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        "display-1": ["clamp(2.5rem, 4.5vw + 1rem, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2rem, 3vw + 1rem, 3.25rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-3": ["clamp(1.5rem, 1.5vw + 1rem, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 16, 0.04), 0 1px 1px rgba(15, 23, 16, 0.03)",
        elevated: "0 8px 24px -12px rgba(15, 23, 16, 0.18), 0 2px 6px rgba(15, 23, 16, 0.05)",
        ring: "0 0 0 4px rgba(111, 128, 80, 0.15)",
      },
      spacing: {
        "section": "4rem",
        "section-lg": "6rem",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [typography],
};

export default config;
