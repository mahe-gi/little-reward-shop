import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Newsreader", "Georgia", "serif"],
        sans: ["Plus Jakarta Sans", "Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        romantic: {
          50: "#fff5f6",
          100: "#fdebee",
          200: "#fad7dc",
          300: "#f6b4be",
          400: "#f08596",
          500: "#e06d75", // Primary Velvet & Keepsake Rose
          600: "#cb4e5a",
          700: "#ab3b46",
          800: "#8e343d",
          900: "#793037",
        },
        warm: {
          cream: "#fcf9f4",
          canvas: "#faf7f2",
          surface: "#ffffff",
          linen: "#fdfbf7",
          muted: "#f6f3ee",
          border: "#efeae1",
          "border-active": "#eae6df",
          dark: "#2c2724",
          subtle: "#756963",
          taupe: "#a89f99",
        },
        tertiary: {
          gold: "#e8a838",
          bg: "#fef7e8",
        },
        terracotta: {
          50: "#fff7ed",
          500: "#d97757",
        },
        sage: {
          50: "#ecfdf5",
          500: "#7e9f85",
        },
      },
      boxShadow: {
        soft: "0 8px 30px -4px rgba(224, 109, 117, 0.08), 0 2px 8px -2px rgba(44, 39, 36, 0.04)",
        float: "0 20px 40px -10px rgba(224, 109, 117, 0.16)",
        sheet: "0 24px 48px -8px rgba(74, 52, 46, 0.14), 0 8px 16px -4px rgba(74, 52, 46, 0.05)",
        "inner-soft": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)",
      },
      borderRadius: {
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
