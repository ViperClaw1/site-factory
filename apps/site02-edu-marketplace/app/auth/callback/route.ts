import { safeNext } from "@/features/auth/validation";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";

// Landing URL for Google OAuth and signup-confirmation links: trades the
// one-time ?code for a session cookie, then continues to ?next.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  // Supabase reports provider failures as ?error=… instead of a code.
  if (searchParams.get("error")) return NextResponse.redirect(new URL("/login?error=oauth", origin));
  if (code) {
    const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=oauth", origin));
  }
  return NextResponse.redirect(new URL(safeNext(searchParams.get("next")), origin));
}
