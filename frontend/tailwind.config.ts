import type { Config } from "tailwindcss";
const withMT = require("@material-tailwind/react/utils/withMT");

const defaultTheme = require("tailwindcss/defaultTheme");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  // experimental: {
  //   optimizeUniversalDefaults: true,
  // },
  theme: {
    extend: {
      fontFamily: {
        robotocondensed: ["var(--font-roboto-condensed)"],
      },
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
    },
    colors: {
      core: {
        outline: "#DDDDDD",
        text: "#222222",
        hover: "#F7F7F7",
      },
      organiser: {
        "light-gray": "#F8F8F8",
        "darker-light-gray": "#E8E8E8",
        "dark-gray-text": "#404040",
        "title-gray-text": "#969696",
      },
      highlight: {
        yellow: "#F2B705",
      },
    },
    boxShadow: {
      searchbar: "0 1px 2px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.05)",
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};

export default withMT(config);
