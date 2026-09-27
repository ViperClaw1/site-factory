import { safeNext } from "@/lib/rbac";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import { NextResponse, type NextRequest } from "next/server";

// Landing URL for Supabase email links (signup confirmation, email change):
// trades the one-time ?code for a session cookie, then continues to ?next.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) await createSupabaseServerClient().auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.nextUrl.origin));
}
