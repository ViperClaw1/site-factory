// Required at startup (ADR-009): a server without these renders an empty
// catalog and a broken login instead of failing, so refuse to start.
// Runtime outages of Directus/Supabase are a different case — lib/api-client.ts
// still falls back to empty state for those.
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DIRECTUS_URL",
  "BASE_URL",
  "NEXT_PUBLIC_SITE_DOMAIN",
] as const;

export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. See apps/site01-path-marketplace/.env.example.`
    );
  }
}
