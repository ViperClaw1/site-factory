import { exportRequestSchema, fieldErrorsOf } from "@/lib/admin/schema";
import { AdminAuthError, exportProducts } from "@/lib/server/admin-products";
import { requireAdmin } from "@/lib/server/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST because a selection can hold more ids than fit in a URL.
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = exportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }

  try {
    return NextResponse.json(await exportProducts(parsed.data));
  } catch (err) {
    if (err instanceof AdminAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error(err instanceof Error ? err.message : "export failed");
    return NextResponse.json({ error: "export_failed" }, { status: 500 });
  }
}
