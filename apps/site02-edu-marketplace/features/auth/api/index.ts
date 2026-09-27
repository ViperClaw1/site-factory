"use client";

import { createSupabaseBrowserClient } from "@repo/lib";
import type { SupabaseClient } from "@supabase/supabase-js";

// Temporary: Supabase email+password / Google. This becomes custom email + OTP
// later, so everything auth-provider-specific lives in this file.

// One browser client for the whole app — it owns session storage + token refresh.
let client: SupabaseClient | null = null;
export function supabaseBrowser(): SupabaseClient {
  client ??= createSupabaseBrowserClient();
  return client;
}

// Where Supabase sends the user back after OAuth / email confirmation.
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function signIn(email: string, password: string) {
  return supabaseBrowser().auth.signInWithPassword({ email, password });
}

export function signUp(email: string, password: string, next: string) {
  return supabaseBrowser().auth.signUp({ email, password, options: { emailRedirectTo: callbackUrl(next) } });
}

export function signOut() {
  return supabaseBrowser().auth.signOut();
}

// Full-page redirect to Google; returns only on error.
export function signInWithGoogle(next: string) {
  return supabaseBrowser().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
}
