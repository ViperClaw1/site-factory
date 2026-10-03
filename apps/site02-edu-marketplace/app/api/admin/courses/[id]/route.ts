import { AdminInputError, CourseMissingError, deleteCourse, SlugTakenError } from "@/lib/server/admin-courses";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function failed(err: unknown): NextResponse {
  if (err instanceof CourseMissingError) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (err instanceof SlugTakenError) return NextResponse.json({ error: "slug_taken" }, { status: 409 });
  if (err instanceof AdminInputError) {
    return NextResponse.json({ error: err.message, fieldErrors: err.fieldErrors }, { status: 400 });
  }
  console.error(err instanceof Error ? err.message : "course delete failed");
  return NextResponse.json({ error: "delete_failed" }, { status: 500 });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await deleteCourse(params.id));
  } catch (err) {
    return failed(err);
  }
}
