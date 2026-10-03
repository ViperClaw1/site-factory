import { AdminAuthError, deleteProduct, ProductMissingError } from "@/lib/server/admin-products";
import { requireAdmin } from "@/lib/server/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failed(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof ProductMissingError) return NextResponse.json({ error: "not_found" }, { status: 404 });
  console.error(err instanceof Error ? err.message : "product delete failed");
  return NextResponse.json({ error: "delete_failed" }, { status: 500 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  try {
    const deleted = await deleteProduct(params.id);
    return NextResponse.json(deleted);
  } catch (err) {
    return failed(err);
  }
}
