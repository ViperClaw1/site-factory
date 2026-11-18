// Schema selector for the self-hosted Supabase instance.
//
// Every site gets its own Postgres schema on the shared Supabase stack
// (ADR-008: one instance, one user pool, per-site isolation). The default
// `public` schema keeps the shared tables; a site sets
// NEXT_PUBLIC_SUPABASE_SCHEMA to its own schema name and all clients below
// talk to that schema through PostgREST (`Accept-Profile`).
export function supabaseSchema(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA?.trim();
  return raw && raw.length > 0 ? raw : "public";
}

/** Options object for createClient/createBrowserClient/createServerClient. */
export function supabaseSchemaOptions(): { db: { schema: string } } {
  return { db: { schema: supabaseSchema() } };
}
