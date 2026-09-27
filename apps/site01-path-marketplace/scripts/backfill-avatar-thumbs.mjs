#!/usr/bin/env node
/**
 * Generate `*_thumb.webp` (160×160, same as app/api/avatar) for existing
 * profile photos in the `avatars` bucket, and record it + a blurhash in
 * profiles.avatar_meta — /account only serves the thumb when avatar_meta
 * lists it. Only avatars referenced by a profile are processed.
 *
 * Usage (from apps/site01-path-marketplace):
 *   node scripts/backfill-avatar-thumbs.mjs [--dry-run] [--force] [--limit 100]
 */
import { encode } from "blurhash";
import {
  createSupabaseAdmin,
  downloadObject,
  errorMessage,
  log,
  objectExists,
  parseLimit,
  variantObjectPath,
} from "./lib/product-images.mjs";

const BUCKET = "avatars";
const THUMB_SIZE = 160; // keep in sync with VARIANTS.thumb in app/api/avatar/route.ts

const args = process.argv.slice(2);
const cli = { dryRun: args.includes("--dry-run"), force: args.includes("--force"), limit: parseLimit(args, 500) };

async function main() {
  const supabase = createSupabaseAdmin();
  const sharp = (await import("sharp")).default;

  // select("*"): avatar_meta may not be migrated yet — checked below.
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .not("avatar_url", "is", null)
    .limit(cli.limit);
  if (error) throw error;
  if (profiles.length > 0 && !("avatar_meta" in profiles[0])) {
    throw new Error(
      "profiles.avatar_meta is missing — run supabase/migrations/20260928000000_profile_avatar_meta.sql first"
    );
  }

  let created = 0;
  let skipped = 0;
  for (const profile of profiles) {
    const path = profile.avatar_url.split(`/${BUCKET}/`)[1]?.split(/[?#]/)[0];
    if (!path || path.includes("_thumb.")) continue;
    const thumbPath = variantObjectPath(path, "thumb");
    const meta = profile.avatar_meta ?? {};

    // Already done: file present and recorded on the profile.
    if (!cli.force && meta.variants?.includes("thumb") && (await objectExists(supabase, BUCKET, thumbPath))) {
      skipped += 1;
      continue;
    }
    if (cli.dryRun) {
      log("avatar", `[dry-run] would create ${BUCKET}/${thumbPath}`);
      created += 1;
      continue;
    }

    try {
      // Same render as the upload route: EXIF-oriented, center-cropped square WebP.
      const original = await downloadObject(supabase, BUCKET, path);
      const thumb = await sharp(original)
        .rotate()
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();
      const upload = await supabase.storage
        .from(BUCKET)
        .upload(thumbPath, thumb, { contentType: "image/webp", cacheControl: "31536000", upsert: true });
      if (upload.error) throw upload.error;

      // Blurhash from the thumb (32×32 sample, 4×3 components).
      const { data, info } = await sharp(thumb).resize(32, 32).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const blurhash = encode(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height, 4, 3);

      // Merge into avatar_meta, keeping any other variants (e.g. hero); new v busts caches.
      const variants = [...new Set([...(meta.variants ?? []), "thumb"])];
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_meta: { ...meta, blurhash, variants, v: Date.now().toString(36) } })
        .eq("id", profile.id);
      if (updateError) throw updateError;

      log("avatar", `created ${BUCKET}/${thumbPath} (${Math.round(thumb.length / 1024)} KB)`);
      created += 1;
    } catch (err) {
      log("avatar", `skip ${path}: ${errorMessage(err)}`);
    }
  }

  log("avatar", `done: ${created} thumb(s) ${cli.dryRun ? "(dry-run)" : "created"}, ${skipped} already present`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
