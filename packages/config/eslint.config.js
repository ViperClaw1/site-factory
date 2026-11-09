const path = require("node:path");
const nextPlugin = require("@next/eslint-plugin-next");
const boundaries = require("eslint-plugin-boundaries");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const tsParser = require("@typescript-eslint/parser");

// ESLint runs from each workspace package, but the element patterns below are
// relative to the repo root.
process.env.ESLINT_PLUGIN_BOUNDARIES_ROOT_PATH ??= path.resolve(__dirname, "../..");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/.turbo/**", "**/.next-verify/**", "**/test-results/**"],
  },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      boundaries,
      "jsx-a11y": jsxA11y,
      "@next/next": nextPlugin,
    },
    settings: {
      // Follows @/ aliases and workspace symlinks to the real files.
      "import/resolver": { typescript: { project: "tsconfig.json" } },
      "boundaries/elements": [
        { type: "app", pattern: "apps/*" },
        { type: "ui", pattern: "packages/ui/*" },
        { type: "lib", pattern: "packages/lib/*" },
        { type: "i18n", pattern: "packages/i18n/*" },
        { type: "types", pattern: "packages/types/*" },
        { type: "config", pattern: "packages/config/*" },
      ],
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
      "@next/next/no-img-element": "error",
      "boundaries/no-unknown": "error",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "app", allow: ["app", "ui", "lib", "i18n", "types", "config"] },
            { from: "ui", allow: ["ui", "types"] },
            { from: "lib", allow: ["lib", "types"] },
            { from: "i18n", allow: ["i18n"] },
            { from: "types", allow: ["types"] },
          ],
        },
      ],
    },
  },
  // Links and navigation must carry the language. Locale-free areas may use Next directly.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "features/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["**/app/admin/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next/link", message: "Use Link from @repo/i18n/client." },
            {
              name: "next/navigation",
              importNames: ["useRouter", "redirect"],
              message: "Use useLocalizedRouter from @repo/i18n/client, or redirect(withLocale(...)).",
            },
          ],
        },
      ],
    },
  },
];
