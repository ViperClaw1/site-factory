const boundaries = require("eslint-plugin-boundaries");
const jsxA11y = require("eslint-plugin-jsx-a11y");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.turbo/**"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: {
      boundaries,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "apps/*" },
        { type: "ui", pattern: "packages/ui/*" },
        { type: "lib", pattern: "packages/lib/*" },
        { type: "types", pattern: "packages/types/*" },
        { type: "config", pattern: "packages/config/*" },
      ],
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "boundaries/no-unknown": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["app", "ui", "lib", "types", "config"] },
            { from: "ui", allow: ["ui", "types"] },
            { from: "lib", allow: ["lib", "types"] },
            { from: "types", allow: ["types"] },
          ],
        },
      ],
    },
  },
];
