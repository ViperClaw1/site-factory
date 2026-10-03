#!/usr/bin/env node
/**
 * Convert course covers in the `courses` bucket to WebP, generate
 * `*_thumb.webp` / `*_gallery.webp` / `*_hero.webp` next to them, and record
 * a blurhash + the variant list in courses.cover_meta. Non-WebP originals are
 * removed once the row points at the new file. Safe to re-run (re-renders all).
 * Mirrors site01's lib/media/pipeline.mjs (variant widths, blurhash settings).
 *
 * Usage (from apps/site02-edu-marketplace):
 *   node scripts/backfill-course-covers.mjs [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";
import { encode } from "blurhash";
import sharp from "sharp";

const BUCKET = "courses";
// Keep in sync with VARIANT_WIDTHS in lib/image-variants.ts.
const VARIANTS = {
  thumb: { width: 400, quality: 70 },
  gallery: { width: 960, quality: 75 },
  hero: { width: 1600, quality: 80 },
};
const dryRun = process.argv.includes("--dry-run");

// ---- Env + client (service role; values are never logged) ----
process.loadEnvFile(".env");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const log = (message) => console.log(`[covers] ${message}`);
const variantPath = (path, variant) => path.replace(/\.[^./]+$/, "") + `_${variant}.webp`;

async function upload(path, body) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
  if (error) throw error;
}

// 32×32 sample, 4×3 components — same as site01's blurhashFromBytes.
async function blurhash(bytes) {
  const { data, info } = await sharp(bytes)
    .resize(32, 32, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height, 4, 3);
}

async function main() {
  // select("*"): cover_meta may not be migrated yet — checked below.
  const { data: courses, error } = await supabase.from("courses").select("*").like("cover_image", `%/object/public/${BUCKET}/%`);
  if (error) throw error;
  if (courses.length > 0 && !("cover_meta" in courses[0])) {
    throw new Error("courses.cover_meta is missing — run supabase/migrations/20261003000002_course_cover_meta.sql first");
  }

  for (const course of courses) {
    const path = decodeURIComponent(course.cover_image.split(`/${BUCKET}/`)[1].split(/[?#]/)[0]);
    const webpPath = path.replace(/\.[^./]+$/, ".webp");
    if (dryRun) {
      log(`[dry-run] ${course.slug}: ${path} → ${webpPath} + ${Object.keys(VARIANTS).join("/")}`);
      continue;
    }

    // ---- Download + render: oriented source, full-size WebP, then each width ----
    const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(path);
    if (downloadError) throw downloadError;
    const original = Buffer.from(await blob.arrayBuffer());
    const source = await sharp(original).rotate().png().toBuffer();

    if (webpPath !== path) await upload(webpPath, await sharp(source).webp({ quality: 82, effort: 5 }).toBuffer());
    let thumb;
    for (const [variant, { width, quality }] of Object.entries(VARIANTS)) {
      const body = await sharp(source).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
      await upload(variantPath(webpPath, variant), body);
      if (variant === "thumb") thumb = body;
      log(`${course.slug}: ${variantPath(webpPath, variant)} (${Math.round(body.length / 1024)} KB)`);
    }

    // ---- Point the row at the WebP; new v busts year-long caches ----
    const cover_meta = {
      ...course.cover_meta,
      blurhash: await blurhash(thumb),
      variants: Object.keys(VARIANTS),
      v: Date.now().toString(36),
    };
    const cover_image = supabase.storage.from(BUCKET).getPublicUrl(webpPath).data.publicUrl;
    const { error: updateError } = await supabase.from("courses").update({ cover_image, cover_meta }).eq("id", course.id);
    if (updateError) throw updateError;

    // Old JPEG is unreferenced only after the update succeeded.
    if (webpPath !== path) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
      if (removeError) log(`${course.slug}: could not remove ${path}: ${removeError.message}`);
    }
    log(`${course.slug}: done (${Math.round(original.length / 1024)} KB original)`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1; // not process.exit(): it trips a libuv assert on Windows while sharp is loaded

});
