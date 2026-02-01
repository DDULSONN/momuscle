import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8" },
        surface: "#f8fafc",
        card: "#ffffff",
      },
      borderRadius: {
        card: "1rem",
        button: "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
