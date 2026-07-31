import { timingSafeEqual, createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Directus webhook target: fires on publish/update so ISR pages (which set
// revalidate = 0) get fresh content immediately instead of waiting on a timer.
//
// The signature travels in a header, never the query string — query strings
// end up in Traefik access logs, the Referer header, and browser history, so
// a token placed there is compromised the moment it's used once. Directus is
// configured to send `X-Revalidate-Signature: hex(hmac_sha256(REVALIDATE_TOKEN, path))`.
function isValidSignature(path: string, signature: string | null): boolean {
  if (!signature) return false;

  const secret = process.env.REVALIDATE_TOKEN;
  if (!secret) return false;

  const expected = createHmac("sha256", secret).update(path).digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");

  // Constant-time compare — a naive !== leaks byte-by-byte match length via
  // response timing. Length must match before timingSafeEqual is safe to call.
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
