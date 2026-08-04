import type { Config } from "tailwindcss";
const withMT = require("@material-tailwind/react/utils/withMT");

const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      screens: {
        xs: "100px",
        ...defaultTheme.screens,
        "3xl": "2200px",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-satoshi)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-space-grotesk)", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        // Unified product radius — prefer rounded-xl
        xl: "var(--radius)",
      },
      boxShadow: {
        searchbar: "0 1px 2px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.05)",
      },
      colors: {
        // App-wide design system — use these for all new UI
        background: "var(--color-background)",
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          hover: "var(--color-surface-hover)",
        },
        border: {
          DEFAULT: "var(--color-border)",
        },
        foreground: {
          DEFAULT: "var(--color-foreground)",
          secondary: "var(--color-foreground-secondary)",
          muted: "var(--color-foreground-muted)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          contrast: "var(--color-accent-contrast)",
        },
        danger: "var(--color-danger)",
        focus: "var(--color-focus)",

        // Legacy aliases → design system (keep until full site migration)
        core: {
          outline: "var(--color-border)",
          text: "var(--color-foreground)",
          hover: "var(--color-surface-hover)",
        },
        organiser: {
          "light-gray": "var(--color-surface)",
          "darker-light-gray": "var(--color-surface-muted)",
          "dark-gray-text": "var(--color-foreground-secondary)",
          "title-gray-text": "var(--color-foreground-muted)",
        },
        highlight: {
          yellow: "var(--color-accent)",
          red: "var(--color-danger)",
          black: "var(--color-foreground)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default withMT(config);
