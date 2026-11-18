import { defineConfig } from "@playwright/test";

// Pure unit tests: no browser and no web server, only the runner the repo already has.
export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  reporter: "list",
});
