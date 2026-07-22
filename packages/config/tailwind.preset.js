/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        bg: "var(--color-bg)",
      },
      fontFamily: {
        heading: ["var(--font-heading)"],
        body: ["var(--font-body)"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};
