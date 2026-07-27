import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Directus webhook target: fires on publish/update so ISR pages (which set
// revalidate = 0) get fresh content immediately instead of waiting on a timer.
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path") ?? "/";
  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path, now: Date.now() });
}
