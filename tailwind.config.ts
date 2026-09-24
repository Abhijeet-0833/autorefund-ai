import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
