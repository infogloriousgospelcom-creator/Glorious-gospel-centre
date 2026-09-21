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
        // Primary brand — Royal Blue / Navy (Glorious Gospel Centre logo).
        brand: {
          50:  "#EAF3FF",
          100: "#D2E5FF",
          200: "#A6CBFF",
          300: "#73ACFF",
          400: "#3D85F0",
          500: "#0B4FC4",
          600: "#093F9C",
          700: "#062B87",
          800: "#04206A",
          900: "#031B4E",
          950: "#020E2E",
        },
        // Scripture / CTA accent — Gold.
        accent: {
          50:  "#FFFAE6",
          100: "#FCEFB0",
          200: "#FBE57A",
          300: "#FFD93D",
          400: "#FFD21F",
          500: "#E5B400",
          600: "#B68A00",
          700: "#8A6800",
          800: "#5E4700",
          900: "#3D2F00",
        },
        // Brand red — small accents and highlights.
        ruby: {
          50:  "#FDECEC",
          100: "#FBD0D0",
          200: "#F69898",
          300: "#EE5E5E",
          400: "#E52323",
          500: "#C21B1B",
          600: "#9F1414",
          700: "#7A0E0E",
          800: "#560909",
          900: "#330505",
        },
        // Neutral text / ink — rebalanced for the new blue palette.
        ink: {
          DEFAULT: "#172033",
          muted: "#5B6475",
          subtle: "#8A93A6",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F9FD",
          inset: "#EEF3FA",
        },
        border: {
          DEFAULT: "#DCE4F0",
        },
        success: { 50: "#E7F5EC", 600: "#16803C", 700: "#0F6030" },
        warning: { 50: "#FCEFD9", 600: "#C98200", 700: "#9A6300" },
        danger:  { 50: "#FDECEC", 600: "#C62828", 700: "#9C1F1F" },
        info:    { 50: "#E6EFFC", 600: "#1B5BB8", 700: "#14478F" },
        // Reserved for livestream / urgent status (use sparingly).
        live: {
          DEFAULT: "#C21B1B",
          soft: "#FDECEC",
          foreground: "#7A0E0E",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Poppins — section titles, nav brand, card titles (already used as font-display).
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        // Cormorant — scripture / hero editorial only.
        "display-serif": ["var(--font-display-serif)", "var(--font-serif)", "Georgia", "serif"],
      },
      fontSize: {
        "display-1": ["clamp(2.5rem, 4.5vw + 1rem, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-2": ["clamp(2rem, 3vw + 1rem, 3.25rem)", { lineHeight: "1.1",  letterSpacing: "-0.02em" }],
        "display-3": ["clamp(1.5rem, 1.5vw + 1rem, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.015em" }],
        "eyebrow":   ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.16em" }],
      },
      borderRadius: {
        sm: "0.375rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.75rem",
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        soft:    "0 1px 2px rgba(3, 27, 78, 0.05), 0 1px 1px rgba(3, 27, 78, 0.04)",
        elevated:"0 12px 32px -16px rgba(3, 27, 78, 0.20), 0 4px 8px rgba(3, 27, 78, 0.06)",
        ring:    "0 0 0 4px rgba(11, 79, 196, 0.18)",
        ringAccent: "0 0 0 4px rgba(255, 210, 31, 0.30)",
      },
      spacing: {
        "section": "4rem",
        "section-lg": "6rem",
        // Comfortable tap target height reference (44px).
        touch: "2.75rem",
      },
      minHeight: {
        touch: "2.75rem",
      },
      minWidth: {
        touch: "2.75rem",
      },
      maxWidth: {
        prose: "42rem",
        content: "48rem",
        page: "80rem",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        reveal: "600ms",
        ui: "200ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;