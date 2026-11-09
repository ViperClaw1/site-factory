import { fieldErrorsOf, slugCheckSchema } from "@/lib/admin/schema";
import { AdminAuthError, existingSlugs } from "@/lib/server/admin-products";
import { requireAdmin } from "@/lib/server/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = slugCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }

  try {
    return NextResponse.json({ existing: await existingSlugs(parsed.data.slugs) });
  } catch (err) {
    if (err instanceof AdminAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err instanceof Error ? err.message : "slug check failed");
    return NextResponse.json({ error: "slug_check_failed" }, { status: 500 });
  }
}
