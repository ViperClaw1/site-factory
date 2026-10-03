const preset = require("@repo/config/tailwind.preset");

// CJK glyphs are not in Manrope/Inter — fall back to platform fonts for 中文 / 日本語.
const cjkFallback = ["PingFang SC", "Hiragino Sans", "Microsoft YaHei", "Yu Gothic", "system-ui", "sans-serif"];

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Hex (not CSS vars) so Tailwind opacity modifiers like bg-brand/10 work.
      colors: {
        brand: "#FFDD2D",
        "brand-dark": "#F2C800",
        ink: "#0B0B0F",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", ...cjkFallback],
        body: ["var(--font-body)", ...cjkFallback],
      },
    },
  },
};
