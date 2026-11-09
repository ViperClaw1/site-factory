import { defineConfig, devices } from "@playwright/test";

// Runs against a production build, same as site01: next dev compiles each route
// on first visit, which parallel workers would hit as timeouts.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3200",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm exec next build && pnpm exec next start -p 3200",
    url: "http://localhost:3200",
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    // canonical and hreflang are absolute, so they must point at this server.
    env: { BASE_URL: "http://localhost:3200" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
