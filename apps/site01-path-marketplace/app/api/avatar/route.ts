import { variantUrl } from "@/lib/image-variants";
import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import { encode } from "blurhash";
import { NextResponse } from "next/server";

// Square avatar variants: thumb = the 80px avatar at 2×, hero = larger uses.
const VARIANTS = { thumb: 160, hero: 512 } as const;

// Post-upload processing for a profile photo: pregenerates square WebP
// variants next to the original and returns a blurhash. Runs as the signed-in
// user (cookie session, not the service key), so the avatars bucket policies
// already restrict it to the caller's own "<uid>/" folder.
export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path } = (await request.json().catch(() => ({}))) as { path?: unknown };
  if (typeof path !== "string" || !path.startsWith(`${user.id}/`) || path.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // 1. Original: fetched through the public URL (the bucket has no SELECT policy).
  const bucket = supabase.storage.from("avatars");
  const originalUrl = bucket.getPublicUrl(path).data.publicUrl;
  const response = await fetch(originalUrl, { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  const original = Buffer.from(await response.arrayBuffer());

  const sharp = (await import("sharp")).default;
  try {
    // 2. Pregen: EXIF-oriented, center-cropped squares, uploaded next to the original.
    const rendered: Partial<Record<keyof typeof VARIANTS, Buffer>> = {};
    for (const [variant, size] of Object.entries(VARIANTS) as [keyof typeof VARIANTS, number][]) {
      const body = await sharp(original).rotate().resize(size, size, { fit: "cover" }).webp({ quality: 80 }).toBuffer();
      const target = new URL(variantUrl(originalUrl, variant)).pathname.split("/avatars/")[1]!;
      const { error } = await bucket.upload(target, body, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (error) throw error;
      rendered[variant] = body;
    }

    // 3. Blurhash from the thumb (32×32 sample, 4×3 components — same as products).
    const { data, info } = await sharp(rendered.thumb!)
      .resize(32, 32, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const blurhash = encode(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height, 4, 3);

    return NextResponse.json({ blurhash, variants: Object.keys(VARIANTS), v: Date.now().toString(36) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
