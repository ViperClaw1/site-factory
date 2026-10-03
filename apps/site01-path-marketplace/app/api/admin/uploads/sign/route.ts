import { fieldErrorsOf, signRequestSchema } from "@/lib/admin/schema";
import { AdminAuthError, AdminInputError, signUploads } from "@/lib/server/admin-products";
import { requireAdmin } from "@/lib/server/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failed(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof AdminInputError) {
    return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: 400 });
  }
  console.error(err instanceof Error ? err.message : "sign failed");
  return NextResponse.json({ error: "sign_failed" }, { status: 500 });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = signRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }

  try {
    const signed = await signUploads(parsed.data);
    return NextResponse.json(signed);
  } catch (err) {
    return failed(err);
  }
}
