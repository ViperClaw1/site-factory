import type { ProductImageVariant } from "@repo/types";

export type BadgeKind = "hot" | "new" | "limited" | "digital" | "blindbox";

// Flat, serializable card view-model shared by real Supabase products and the
// showcase placeholders, so one <ProductCard> renders both and server pages
// can pass items straight into client sections.
export interface CardItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  character?: string | null;
  // Matches Character.slug for real products, or the lower-cased name for
  // showcase items — what the home page's character tabs filter on.
  characterKey?: string | null;
  price: number;
  compareAt?: number;
  currency: string;
  image?: string;
  imageAlt?: string;
  // Pregenerated sizes of `image` (served via lib/image-variants.ts loader)
  // and its decoded blurhash placeholder (computed server-side).
  imageVariants?: ProductImageVariant[];
  imageVersion?: string;
  imageBlurDataUrl?: string;
  badge?: BadgeKind | null;
  soldOut?: boolean;
  editionSize?: number | null;
  category?: string;
}

export function unsplash(id: string, width = 800, height = width): string {
  return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}&fit=crop&auto=format`;
}
