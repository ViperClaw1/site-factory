// Single source for the shop taxonomy. Imported by the storefront
// (lib/shop-categories.ts), the admin uploader, and the image scripts.
// Bucket ids match category slugs. Underscores are valid on the target
// Supabase: creating `collectible_toys` succeeded (checked 2026-10-03).
// If a future host rejects `_`, map it in bucketForCategory only.

export const CATEGORIES = [
  "toys",
  "collectible_toys",
  "books",
  "artbooks",
  "designs",
  "merch",
  "figures",
];

export function bucketForCategory(category) {
  return category;
}

export const CATALOG_BUCKETS = CATEGORIES.map((category) => bucketForCategory(category));
