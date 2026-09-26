"use client";

import { variantLoader } from "@/lib/image-variants";
import type { ProductImageVariant } from "@repo/types";
import { ImageWithFallback } from "@repo/ui";
import { useMemo } from "react";

export interface CatalogImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  // From products.images[i] — both optional, so showcase/Unsplash images and
  // not-yet-backfilled uploads still render (through Next's own optimizer).
  variants?: ProductImageVariant[];
  version?: string;
  blurDataUrl?: string;
}

// Fill-mode product image: pregenerated Supabase variants via a custom loader
// when available, blurhash placeholder while loading when available.
export function CatalogImage({ src, alt, sizes, className, priority, variants, version, blurDataUrl }: CatalogImageProps) {
  const loader = useMemo(() => (variants?.length ? variantLoader(variants, version) : undefined), [variants, version]);

  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loader={loader}
      placeholder={blurDataUrl ? "blur" : "empty"}
      blurDataURL={blurDataUrl}
      className={className}
    />
  );
}
