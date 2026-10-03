import { fieldErrorsOf, signRequestSchema } from "@/lib/admin/schema";
import { AdminInputError, signCover, SlugTakenError } from "@/lib/server/admin-courses";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failed(err: unknown): NextResponse {
  if (err instanceof SlugTakenError) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  if (err instanceof AdminInputError) {
    return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: 400 });
  }
  console.error(err instanceof Error ? err.message : "sign failed");
  return NextResponse.json({ error: "sign_failed" }, { status: 500 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }
  try {
    return NextResponse.json(await signCover(parsed.data));
  } catch (err) {
    return failed(err);
  }
}
