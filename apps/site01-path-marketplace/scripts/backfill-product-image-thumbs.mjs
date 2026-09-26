#!/usr/bin/env node
/**
 * Generate only `*_thumb.webp` for product images — the quick pass that covers
 * every grid card. Same runner as the pregen script, restricted to `thumb`.
 *
 * Usage (from apps/site01-path-marketplace):
 *   node scripts/backfill-product-image-thumbs.mjs [--dry-run] [--limit 100] [--slug …]
 */
import { argValue, createSupabaseAdmin, parseLimit } from "./lib/product-images.mjs";
import { runPregen } from "./lib/pregen.mjs";

const args = process.argv.slice(2);

runPregen(createSupabaseAdmin(), {
  dryRun: args.includes("--dry-run"),
  force: args.includes("--force"),
  limit: parseLimit(args, 500),
  slug: argValue(args, "--slug"),
  variants: ["thumb"],
  tag: "thumb",
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
