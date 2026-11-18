import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

import { supabaseSchemaOptions } from "./supabase-schema";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseSchemaOptions()
  );
}

// Plain anon-key client with no cookie/session handling вЂ” safe to call from
// Server Components (ISR/RSC) doing public, non-personalized catalog reads.
// Use createSupabaseServerClient instead when the query needs the visitor's
// auth session (orders, wishlist, digital access).
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    supabaseSchemaOptions()
  );
}
