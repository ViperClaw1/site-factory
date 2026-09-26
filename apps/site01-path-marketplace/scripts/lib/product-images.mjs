// Shared helpers for the product-image backfill scripts (pregen variants,
// thumbs, blurhashes). Product images live in public Supabase Storage buckets
// and are referenced from products.images (jsonb) as
//   { url, alt?, blurhash?, variants?: ("thumb" | "gallery" | "hero")[], v? }
// (`v` = variants version, bumped on every re-render for cache busting)
// Variant files sit next to the original: img-0818.webp → img-0818_thumb.webp.
//
// NOTE: variant names/widths are mirrored in lib/image-variants.ts (the
// storefront's next/image loader) — keep the two in sync.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

export const PRODUCT_IMAGE_BUCKETS = ["characters", "toys"];

// Longest useful width per variant: thumb → grid cards, gallery → PDP on
// laptops/tablets, hero → PDP/hero on large and high-DPI screens.
export const PRODUCT_IMAGE_VARIANTS = {
  thumb: { width: 400, quality: 70 },
  gallery: { width: 960, quality: 75 },
  hero: { width: 1600, quality: 80 },
};

// Env + client ---------------------------------------------------------------

// Parse .env.local directly (no dotenv dependency). Never log the values.
export function loadEnv() {
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return { url: url.replace(/\/$/, ""), serviceKey };
}

export function createSupabaseAdmin() {
  const { url, serviceKey } = loadEnv();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function log(tag, message) {
  console.log(`[${tag}] ${message}`);
}

export function errorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

// CLI args: supports `--name value` and `--name=value`.
export function argValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

export function parseLimit(args, fallback) {
  const limit = Number.parseInt(argValue(args, "--limit") ?? "", 10);
  return Number.isFinite(limit) && limit > 0 ? limit : fallback;
}

// Storage paths ---------------------------------------------------------------

// Public object URL → { bucket, objectPath } for our product buckets, else null.
export function parseStorageUrl(url) {
  const match = String(url ?? "").match(/\/storage\/v1\/object\/public\/([^/]+)\/([^?#]+)/);
  if (!match || !PRODUCT_IMAGE_BUCKETS.includes(match[1])) return null;
  return { bucket: match[1], objectPath: decodeURIComponent(match[2]) };
}

export function isVariantPath(objectPath) {
  return Object.keys(PRODUCT_IMAGE_VARIANTS).some((variant) => objectPath.includes(`_${variant}.`));
}

export function variantObjectPath(objectPath, variant) {
  return objectPath.replace(/\.[^./]+$/, "") + `_${variant}.webp`;
}

// Existence check via a filtered listing — avoids downloading the object.
export async function objectExists(supabase, bucket, objectPath) {
  const slash = objectPath.lastIndexOf("/");
  const dir = slash >= 0 ? objectPath.slice(0, slash) : "";
  const name = objectPath.slice(slash + 1);
  const { data, error } = await supabase.storage.from(bucket).list(dir, { search: name, limit: 100 });
  if (error) throw error;
  return (data ?? []).some((entry) => entry.name === name);
}

export async function downloadObject(supabase, bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

// Variant rendering -------------------------------------------------------------

// Near-uniform border color tolerance for sharp's trim (0–255 distance).
const TRIM_THRESHOLD = 10;
// Second pass: an edge row/column counts as blank when at least this share of
// its pixels is near-white (every channel above NEAR_WHITE).
// 0.8, not 0.9: some margins carry sparse doodles (stars, sketch lines)
// that keep them ~87% white.
const BLANK_LINE_SHARE = 0.8;
const NEAR_WHITE = 235;

// sharp's trim stops at the first non-background pixel, so a hat tip or stray
// sketch line poking into a white margin leaves the whole band in place. This
// crops edge rows/columns that are *mostly* near-white, capped at 40% per axis
// so an image that is largely white by design can't be cropped away.
async function cropMostlyBlankEdges(sharp, input) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const isWhite = (x, y) => {
    const i = (y * W + x) * 3;
    return data[i] > NEAR_WHITE && data[i + 1] > NEAR_WHITE && data[i + 2] > NEAR_WHITE;
  };
  const rowBlank = (y) => {
    let n = 0;
    for (let x = 0; x < W; x++) if (isWhite(x, y)) n++;
    return n / W >= BLANK_LINE_SHARE;
  };
  const colBlank = (x, top, bottom) => {
    let n = 0;
    for (let y = top; y < bottom; y++) if (isWhite(x, y)) n++;
    return n / (bottom - top) >= BLANK_LINE_SHARE;
  };

  let top = 0;
  let bottom = H;
  while (top < H * 0.4 && rowBlank(top)) top++;
  while (H - bottom < H * 0.4 && bottom - 1 > top && rowBlank(bottom - 1)) bottom--;
  let left = 0;
  let right = W;
  while (left < W * 0.4 && colBlank(left, top, bottom)) left++;
  while (W - right < W * 0.4 && right - 1 > left && colBlank(right - 1, top, bottom)) right--;

  if (top === 0 && left === 0 && bottom === H && right === W) return input;
  return sharp(input)
    .extract({ left, top, width: right - left, height: bottom - top })
    .toBuffer();
}

// Auto-orient and trim blank canvas borders (the character illustrations sit
// on 16–55% white margins, which showed up as empty bands in the cropped
// cards). Returns a lossless PNG buffer; do this once per image and feed the
// result to renderVariant for every size.
export async function prepareSource(bytes) {
  const sharp = (await import("sharp")).default;
  // Pass 1: exact uniform-border trim (throws on fully uniform images → keep input).
  const oriented = await sharp(bytes).rotate().png().toBuffer();
  const trimmed = await sharp(oriented)
    .trim({ threshold: TRIM_THRESHOLD })
    .png()
    .toBuffer()
    .catch(() => oriented);
  // Pass 2: tolerant crop of mostly-blank edges.
  return cropMostlyBlankEdges(sharp, trimmed);
}

// Resize a prepared source by width (never upscaling), strip metadata, WebP.
export async function renderVariant(source, variant) {
  const { width, quality } = PRODUCT_IMAGE_VARIANTS[variant];
  const sharp = (await import("sharp")).default;
  return sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toBuffer();
}

// `source` must come from prepareSource (oriented + trimmed).
export async function uploadVariant(supabase, bucket, objectPath, source, variant) {
  const path = variantObjectPath(objectPath, variant);
  const body = await renderVariant(source, variant);
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: "image/webp",
    cacheControl: "31536000", // variants are content-stable → cache for a year
    upsert: true,
  });
  if (error) throw error;
  return { path, bytes: body.length };
}

// Products ----------------------------------------------------------------------

export async function fetchProducts(supabase, { limit, slug }) {
  let query = supabase.from("products").select("id, slug, images").order("created_at", { ascending: false });
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function saveProductImages(supabase, productId, images) {
  const { error } = await supabase.from("products").update({ images }).eq("id", productId);
  if (error) throw error;
}
