// Pure product-image helpers (no filesystem, no env). Shared by the backfill
// scripts (via scripts/lib/product-images.mjs) and the admin uploader.
//
// Variant files sit next to the original: img-0818.webp → img-0818_thumb.webp.
// NOTE: variant names/widths are mirrored in lib/image-variants.ts — keep them
// in sync.

import { encode } from "blurhash";
import { CATALOG_BUCKETS } from "../catalog-taxonomy.mjs";

export const PRODUCT_IMAGE_BUCKETS = [...new Set(["characters", "toys", ...CATALOG_BUCKETS])];

// Longest useful width per variant: thumb → grid cards, gallery → PDP on
// laptops/tablets, hero → PDP/hero on large and high-DPI screens.
export const PRODUCT_IMAGE_VARIANTS = {
  thumb: { width: 400, quality: 70 },
  gallery: { width: 960, quality: 75 },
  hero: { width: 1600, quality: 80 },
};

// 32×32 sample, 4×3 components — same settings as the blurhash backfill.
const BLUR_SAMPLE_SIZE = 32;
const COMPONENTS_X = 4;
const COMPONENTS_Y = 3;

// Public object URL → { bucket, objectPath } for known product buckets, else null.
export function parseStorageUrl(url, buckets = PRODUCT_IMAGE_BUCKETS) {
  const match = String(url ?? "").match(/\/storage\/v1\/object\/public\/([^/]+)\/([^?#]+)/);
  if (!match || !buckets.includes(match[1])) return null;
  return { bucket: match[1], objectPath: decodeURIComponent(match[2]) };
}

export function isVariantPath(objectPath) {
  return Object.keys(PRODUCT_IMAGE_VARIANTS).some((variant) => objectPath.includes(`_${variant}.`));
}

export function variantObjectPath(objectPath, variant) {
  return objectPath.replace(/\.[^./]+$/, "") + `_${variant}.webp`;
}

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
  const oriented = await sharp(bytes).rotate().png().toBuffer();
  const trimmed = await sharp(oriented)
    .trim({ threshold: TRIM_THRESHOLD })
    .png()
    .toBuffer()
    .catch(() => oriented);
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
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw error;
  return { path, bytes: body.length };
}

// Decode → 32×32 RGBA → blurhash. Pass the thumb bytes when you have them.
export async function blurhashFromBytes(bytes) {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(bytes)
    .rotate()
    .resize(BLUR_SAMPLE_SIZE, BLUR_SAMPLE_SIZE, { fit: "cover" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels !== 4 || data.length !== info.width * info.height * 4) {
    throw new Error(`unexpected pixel buffer (${info.channels} ch, ${data.length} bytes)`);
  }
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  return encode(pixels, info.width, info.height, COMPONENTS_X, COMPONENTS_Y);
}
