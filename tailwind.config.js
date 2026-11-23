/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // The live pairing is chosen in globals.css (--font-display /
        // --font-sans point at the A or B next/font variables).
        display: ["var(--font-display)", "Georgia", "'Times New Roman'", "serif"],
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "'Segoe UI'", "sans-serif"],
      },
      fontSize: {
        // Type scale (UI style plan, Pass 1a item 2). Use these tokens
        // instead of improvising sizes per component.
        display: ["3rem", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        h1: ["2.25rem", { lineHeight: "1.15" }],
        h2: ["1.75rem", { lineHeight: "1.25" }],
        h3: ["1.375rem", { lineHeight: "1.35" }],
      },
      boxShadow: {
        card: "0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.05)",
      },
      colors: {
        primary: "rgb(var(--color-primary-rgb) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark-rgb) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary-rgb) / <alpha-value>)",
        "secondary-dark": "rgb(var(--color-secondary-dark-rgb) / <alpha-value>)",
        accent: "rgb(var(--color-accent-rgb) / <alpha-value>)",
        "accent-dark": "rgb(var(--color-accent-dark-rgb) / <alpha-value>)",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
        info: "#2563eb",
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-in forwards",
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
