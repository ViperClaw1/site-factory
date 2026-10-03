import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client. Never import this from a client component — `server-only`
// throws if it ends up in a browser bundle, and the key must not be logged.
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Catalog admin requires SUPABASE_SERVICE_ROLE_KEY at runtime.");
  }
  client ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next.js caches fetch() in the Data Cache. A cached product list survives
    // both router.refresh() and a full reload after a delete.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return client;
}
