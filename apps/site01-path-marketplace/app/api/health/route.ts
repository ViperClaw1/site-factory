import { NextResponse } from "next/server";

// Health gate for the deploy (ADR-009): status + deployed commit SHA.
// Shallow on purpose — no Directus/Supabase check, so a CMS outage doesn't
// make the orchestrator kill a healthy container.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", version: process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown" });
}
