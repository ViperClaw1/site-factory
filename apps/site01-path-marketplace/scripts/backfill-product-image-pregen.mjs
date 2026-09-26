#!/usr/bin/env node
/**
 * Generate `*_thumb.webp`, `*_gallery.webp`, `*_hero.webp` for product images
 * in the `characters` / `toys` buckets, and record them on products.images.
 *
 * Usage (from apps/site01-path-marketplace):
 *   node scripts/backfill-product-image-pregen.mjs [--dry-run] [--limit 100] [--slug labubu-the-monsters-s3]
 *   node scripts/backfill-product-image-pregen.mjs --variants thumb,hero
 *   node scripts/backfill-product-image-pregen.mjs --force   # re-render existing variants
 */
import { argValue, createSupabaseAdmin, parseLimit, PRODUCT_IMAGE_VARIANTS } from "./lib/product-images.mjs";
import { runPregen } from "./lib/pregen.mjs";

function parseArgs(argv) {
  const args = argv.slice(2);
  const variants = (argValue(args, "--variants") ?? "thumb,gallery,hero")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v in PRODUCT_IMAGE_VARIANTS);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    limit: parseLimit(args, 500),
    slug: argValue(args, "--slug"),
    variants: variants.length > 0 ? variants : Object.keys(PRODUCT_IMAGE_VARIANTS),
  };
}

runPregen(createSupabaseAdmin(), parseArgs(process.argv)).catch((err) => {
  console.error(err);
  process.exit(1);
});
