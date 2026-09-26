import type { ProductImageVariant } from "@repo/types";
import type { ImageLoader } from "next/image";

// Mirrors PRODUCT_IMAGE_VARIANTS in scripts/lib/product-images.mjs (widths
// only) — keep the two in sync. Ordered smallest → largest.
const VARIANT_WIDTHS: [ProductImageVariant, number][] = [
  ["thumb", 400],
  ["gallery", 960],
  ["hero", 1600],
];

// `…/img-0818.webp` → `…/img-0818_thumb.webp` (query/hash preserved).
export function variantUrl(url: string, variant: ProductImageVariant): string {
  return url.replace(/(\.[^./?#]+)?([?#].*)?$/, (_, _ext, rest = "") => `_${variant}.webp${rest}`);
}

// next/image loader serving pregenerated variants straight from Supabase
// Storage: for each srcset width, the smallest existing variant that covers
// it (else the largest one). Skips Next's runtime resizing entirely.
// `version` (products.images[i].v) is appended as ?v=… so re-rendered
// variants — cached for a year under the same file name — get fresh URLs.
export function variantLoader(variants: ProductImageVariant[], version?: string): ImageLoader {
  const available = VARIANT_WIDTHS.filter(([variant]) => variants.includes(variant));
  const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
  return ({ src, width }) => {
    const match = available.find(([, w]) => w >= width) ?? available[available.length - 1];
    return match ? variantUrl(src, match[0]) + suffix : src;
  };
}
