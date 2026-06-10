import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        white: "var(--bg-card)",
        primary: {
          DEFAULT: "var(--ea-blue-light)",
          foreground: "#FFFFFF"
        },
        slate: {
          50: "var(--bg-elevated)",
          100: "var(--border-light)",
          200: "var(--border)",
          300: "var(--border-light)",
          400: "var(--text-muted)",
          500: "var(--text-secondary)",
          600: "var(--text-secondary)",
          700: "var(--text-secondary)",
          800: "var(--text-primary)",
          900: "var(--text-primary)",
          950: "var(--text-primary)"
        },
        air: {
          light: "var(--ea-blue-light)",
          dark: "var(--bg-surface)",
          gold: "var(--ea-gold)",
          up: "var(--color-success-fg)",
          down: "var(--color-danger-fg)",
          page: "var(--bg-base)",
          card: "var(--bg-card)"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      boxShadow: {
        card: "var(--shadow-card)",
        blue: "var(--shadow-blue)",
        gold: "var(--shadow-gold)"
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      }
    }
  },
  plugins: []
};

export default config;
