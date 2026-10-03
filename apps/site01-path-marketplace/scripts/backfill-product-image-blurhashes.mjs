#!/usr/bin/env node
/**
 * Backfill products.images[i].blurhash for product images that lack one.
 * Samples the `_thumb` variant when it exists (much smaller download),
 * falling back to the original.
 *
 * Usage (from apps/site01-path-marketplace):
 *   node scripts/backfill-product-image-blurhashes.mjs [--dry-run] [--limit 50] [--slug …] [--force]
 */
import {
  blurhashFromBytes,
  createSupabaseAdmin,
  downloadObject,
  errorMessage,
  argValue,
  fetchProducts,
  log,
  parseLimit,
  parseStorageUrl,
  saveProductImages,
  variantObjectPath,
} from "./lib/product-images.mjs";

function parseArgs(argv) {
  const args = argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"), // recompute even when a blurhash exists
    limit: parseLimit(args, 200),
    slug: argValue(args, "--slug"),
  };
}

// Prefer the thumb (if pregen recorded it), then the original.
async function sampleBytes(supabase, ref, image) {
  const candidates = [
    ...(image.variants?.includes("thumb") ? [variantObjectPath(ref.objectPath, "thumb")] : []),
    ref.objectPath,
  ];
  const errors = [];
  for (const path of candidates) {
    try {
      return await downloadObject(supabase, ref.bucket, path);
    } catch (err) {
      errors.push(`${path}: ${errorMessage(err)}`);
    }
  }
  throw new Error(errors.join("; "));
}

async function main() {
  const cli = parseArgs(process.argv);
  const supabase = createSupabaseAdmin();
  const products = await fetchProducts(supabase, cli);

  let updated = 0;
  for (const product of products) {
    let rowChanged = false;
    const images = [];

    for (const image of Array.isArray(product.images) ? product.images : []) {
      const ref = parseStorageUrl(image?.url);
      if (!ref || (image.blurhash && !cli.force)) {
        images.push(image);
        continue;
      }
      try {
        const hash = await blurhashFromBytes(await sampleBytes(supabase, ref, image));
        log("blurhash", `${cli.dryRun ? "[dry-run] " : ""}${product.slug} ${ref.objectPath} -> ${hash.slice(0, 12)}…`);
        images.push({ ...image, blurhash: hash });
        rowChanged = true;
        updated += 1;
      } catch (err) {
        log("blurhash", `skip ${product.slug} ${ref.objectPath}: ${errorMessage(err)}`);
        images.push(image);
      }
    }

    if (rowChanged && !cli.dryRun) await saveProductImages(supabase, product.id, images);
  }

  log("blurhash", `done: ${updated} image(s) ${cli.dryRun ? "(dry-run)" : "updated"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
