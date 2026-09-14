import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F7F8F6",
        surface: "#FFFFFF",
        ink: "#16211D",
        muted: "#5B6B63",
        line: "#D8DED9",
        primary: {
          DEFAULT: "#0F5C4F",
          dark: "#0B453B",
          light: "#E4F0EC",
        },
        accent: {
          DEFAULT: "#E9A23B",
          dark: "#C9821E",
        },
        danger: "#B3413A",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};
export default config;
