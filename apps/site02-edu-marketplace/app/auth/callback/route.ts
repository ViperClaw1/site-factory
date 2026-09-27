import { safeNext } from "@/features/auth/validation";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";

// Landing URL for Google OAuth and signup-confirmation links: trades the
// one-time ?code for a session cookie, then continues to ?next.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  // Failed recovery links go to /reset-password, which shows "link expired"
  // (it has no session); everything else is an OAuth/confirmation failure.
  const failure = new URL(next === "/reset-password" ? next : "/login?error=oauth", origin);

  // Supabase reports provider failures as ?error=… instead of a code.
  if (searchParams.get("error")) {
    console.error("[auth/callback] provider error:", searchParams.get("error_description"));
    return NextResponse.redirect(failure);
  }
  if (code) {
    const { error } = await createSupabaseServerClient().auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] code exchange failed:", error.message);
      return NextResponse.redirect(failure);
    }
  }
  return NextResponse.redirect(new URL(next, origin));
}
