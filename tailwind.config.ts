import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bhoot: {
          950: "#07080a",
          900: "#0d0f14",
          800: "#151821",
          700: "#222736",
          600: "#343b52",
          crimson: "#8b181b",
          blood: "#b91c1c",
          amber: "#d97706",
          lantern: "#f59e0b",
          parchment: "#d6cbb8",
          fog: "#94a3b8",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        mono: ["Courier New", "monospace"],
      },
      animation: {
        flicker: "flicker 3s infinite ease-in-out",
        "creepy-pulse": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        lightning: "lightning 8s infinite",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "33%": { opacity: "0.85" },
          "35%": { opacity: "0.4" },
          "37%": { opacity: "0.9" },
          "70%": { opacity: "0.95" },
          "72%": { opacity: "0.3" },
          "75%": { opacity: "1" },
        },
        lightning: {
          "0%, 94%, 100%": { opacity: "0" },
          "95%": { opacity: "0.8" },
          "96%": { opacity: "0.1" },
          "97%": { opacity: "0.95" },
          "98%": { opacity: "0.2" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
