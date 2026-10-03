import { fieldErrorsOf, productInputSchema } from "@/lib/admin/schema";
import {
  AdminAuthError,
  AdminInputError,
  createProduct,
  listProducts,
  SlugTakenError,
} from "@/lib/server/admin-products";
import { requireAdmin } from "@/lib/server/require-admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function failed(err: unknown): NextResponse {
  if (err instanceof AdminAuthError) return NextResponse.json({ error: err.message }, { status: err.status });
  if (err instanceof SlugTakenError) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  if (err instanceof AdminInputError) {
    return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: 400 });
  }
  console.error(err instanceof Error ? err.message : "product write failed");
  return NextResponse.json({ error: "create_failed" }, { status: 500 });
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  const url = new URL(request.url);
  try {
    const data = await listProducts({
      category: url.searchParams.get("category") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      q: url.searchParams.get("q") ?? undefined,
      page: Number(url.searchParams.get("page") ?? "1"),
    });
    return NextResponse.json({ items: data.items, total: data.total });
  } catch (err) {
    return failed(err);
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "not_found" }, { status: auth.status });

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }

  try {
    const created = await createProduct(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return failed(err);
  }
}
