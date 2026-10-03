import "server-only";

import type { Product } from "@repo/types";
import { blurhashToDataUrl } from "./blurhash";
import type { BadgeKind, CardItem } from "./catalog";
import { coverImage } from "./media";

// Real product → card. Server-only (it decodes blurhashes), which also keeps
// the blurhash library out of client bundles that import lib/catalog.
// The schema has no dedicated blind-box/hot flags, so badges are inferred:
// every collectible "collectible_toys" product is sold blind, other
// collectibles are limited editions, digital goods get DIGITAL.
export function toCardItem(product: Product): CardItem {
  const cover = coverImage(product);
  let badge: BadgeKind | null = null;
  if (product.is_collectible) {
    badge = product.category === "collectible_toys" ? "blindbox" : "limited";
  } else if (product.product_type === "digital") {
    badge = "digital";
  }

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.series,
    character: product.character,
    characterKey: product.character,
    price: product.base_price,
    currency: product.currency,
    image: cover?.url,
    imageAlt: cover?.alt ?? product.title,
    imageVariants: cover?.variants,
    imageVersion: cover?.v,
    imageBlurDataUrl: blurhashToDataUrl(cover?.blurhash),
    badge,
    editionSize: product.edition_size,
    category: product.category,
  };
}
