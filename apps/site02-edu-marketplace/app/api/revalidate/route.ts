import { timingSafeEqual, createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

function isValidSignature(path: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.REVALIDATE_TOKEN;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(path).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");

  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "/";
  const signature = request.headers.get("x-revalidate-signature");

  if (!isValidSignature(path, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  revalidatePath(path);

  return NextResponse.json({ revalidated: true, path, now: Date.now() });
}
