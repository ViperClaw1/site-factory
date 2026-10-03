import type { Course } from "@repo/types";
import type { ImageLoader, ImageProps } from "next/image";

// Mirrors VARIANTS in scripts/backfill-course-covers.mjs (widths only) —
// keep the two in sync. Ordered smallest → largest. Same as site01.
const VARIANT_WIDTHS = [
  ["thumb", 400],
  ["gallery", 960],
  ["hero", 1600],
] as const;

type Variant = (typeof VARIANT_WIDTHS)[number][0];

// `…/python.webp` → `…/python_thumb.webp` (query/hash preserved).
function variantUrl(url: string, variant: Variant): string {
  return url.replace(/(\.[^./?#]+)?([?#].*)?$/, (_, _ext, rest = "") => `_${variant}.webp${rest}`);
}

// next/image loader serving pregenerated variants straight from Supabase
// Storage: for each srcset width, the smallest variant that covers it (else
// the largest). `version` is appended as ?v=… so re-rendered files get fresh URLs.
function variantLoader(variants: Variant[], version?: string): ImageLoader {
  const available = VARIANT_WIDTHS.filter(([variant]) => variants.includes(variant));
  const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
  return ({ src, width }) => {
    const match = available.find(([, w]) => w >= width) ?? available[available.length - 1];
    return match ? variantUrl(src, match[0]) + suffix : src;
  };
}

// Loader + blurhash placeholder for a course cover. Covers without metadata
// (not yet backfilled, external URLs) fall back to Next's optimizer, no blur.
export function coverImageProps(course: Course): Pick<ImageProps, "loader" | "placeholder" | "blurDataURL"> {
  const variants = course.cover_meta?.variants ?? [];
  return {
    loader: variants.length ? variantLoader(variants, course.cover_meta?.v) : undefined,
    placeholder: course.cover_blur ? "blur" : "empty",
    blurDataURL: course.cover_blur,
  };
}
