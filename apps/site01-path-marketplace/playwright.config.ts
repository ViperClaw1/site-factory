import { defineConfig, devices } from "@playwright/test";

// Catalog data (Directus/Supabase) is unavailable in CI/local test runs, so
// every test exercises the placeholder-driven flow (see lib/placeholders.ts)
// — that flow is exactly what needs covering before the real catalog exists.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  // Runs against a production build (next build && next start), not next
  // dev — the dev server compiles each route on first visit, and multiple
  // parallel test workers hitting cold routes at once made navigation
  // clicks appear to silently do nothing (really: stuck waiting on the
  // compiler). A production server has no such lag and is what's actually
  // deployed (see 07-deployment docs), so it's the more honest target too.
  webServer: {
    command: "pnpm exec next build && pnpm exec next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
