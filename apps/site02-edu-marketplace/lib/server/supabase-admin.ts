import "server-only";

import { supabaseSchemaOptions } from "@repo/lib/supabase-schema";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Схема задаётся в рантайме (NEXT_PUBLIC_SUPABASE_SCHEMA), поэтому тип
// не фиксируем на "public" — иначе TS сужает generic и db.schema не проходит.
let client: SupabaseClient<any, any, any, any, any> | null = null;

export function supabaseAdmin(): SupabaseClient<any, any, any, any, any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Course admin requires SUPABASE_SERVICE_ROLE_KEY at runtime.");
  }
  client ??= createClient(url, serviceKey, {
    ...supabaseSchemaOptions(),
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return client;
}
