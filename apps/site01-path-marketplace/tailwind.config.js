const preset = require("@repo/config/tailwind.preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ToyVerse Memphis palette — hot pink / golden yellow / electric blue on
      // near-black ink and a warm off-white "cream" for alternate sections.
      colors: {
        pink: { DEFAULT: "#FF2D55", dark: "#D6153F", soft: "#FFE3EA" },
        sun: { DEFAULT: "#FFC62B", soft: "#FFF3CC" },
        electric: { DEFAULT: "#2E5BFF", soft: "#E1E8FF" },
        ink: { DEFAULT: "#111111", soft: "#2A2A2A" },
        cream: "#F6F4EE",
      },
      fontFamily: {
        display: ["var(--font-heading)"],
      },
      // Slow bob/spin for the decorative Memphis shapes.
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(6deg)" },
        },
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "float-slow": "float 11s ease-in-out infinite",
        "spin-slow": "spin 24s linear infinite",
      },
    },
  },
};
