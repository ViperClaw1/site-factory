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
    timeout: 600_000,
    // canonical and hreflang are absolute, so they must point at this server.
    // ADMIN_PUBLIC=1 lets admin UI tests run without a Supabase session.
    // Locally the rest comes from .env.local; in CI (no .env.local) lib/env.ts
    // gets placeholders — set here they would override .env.local.
    env: {
      ...(process.env.CI
        ? {
            NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
            NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
            SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
            DIRECTUS_URL: "http://127.0.0.1:8055",
            NEXT_PUBLIC_SITE_DOMAIN: "localhost",
          }
        : {}),
      BASE_URL: "http://localhost:3100",
      ADMIN_PUBLIC: "1",
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
