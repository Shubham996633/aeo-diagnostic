import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          400: "#a1a1aa",
          600: "#52525b",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        accent: {
          DEFAULT: "#7c3aed",
          soft: "#ede9fe",
          ring: "#a78bfa",
        },
        win: "#10b981",
        lose: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(9, 9, 11, 0.04), 0 4px 24px rgba(9, 9, 11, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
