import { courseInputSchema, fieldErrorsOf } from "@/lib/admin/schema";
import { AdminInputError, createCourse, listCourses, SlugTakenError } from "@/lib/server/admin-courses";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function failed(err: unknown): NextResponse {
  if (err instanceof SlugTakenError) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  if (err instanceof AdminInputError) {
    return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: 400 });
  }
  console.error(err instanceof Error ? err.message : "course write failed");
  return NextResponse.json({ error: "create_failed" }, { status: 500 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const data = await listCourses({
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
  const body = await request.json().catch(() => null);
  const parsed = courseInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid", fieldErrors: fieldErrorsOf(parsed.error) }, { status: 400 });
  }
  try {
    return NextResponse.json(await createCourse(parsed.data), { status: 201 });
  } catch (err) {
    return failed(err);
  }
}
