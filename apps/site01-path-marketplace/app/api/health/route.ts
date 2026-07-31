import { NextResponse } from "next/server";

// Coolify health-check target. Kept dependency-free on purpose: this only
// needs to prove the Next.js server itself is up, not that Directus/Supabase
// are reachable — a downstream outage shouldn't make Coolify kill a
// perfectly healthy container.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
