import { formatPrice } from "@repo/lib";
import { Card, ImageWithFallback } from "@repo/ui";
import type { Product } from "@repo/types";
import Link from "next/link";
import { CollectibleBadge } from "./CollectibleBadge";
import { StockCounter } from "./StockCounter";

export interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const cover = product.images[0];
  // Schema has no dedicated blind-box flag — infer it from category until one
  // is added; every "collectible_toys" product is sold blind in the mystery
  // box mechanic.
  const isBlindBox = product.is_collectible && product.category === "collectible_toys";

  return (
    <Link href={`/p/${product.slug}`} className="group block">
      <Card className={`overflow-hidden ${featured ? "sm:col-span-2" : ""}`}>
        <div className="relative aspect-square w-full overflow-hidden bg-black/5">
          {cover ? (
            <ImageWithFallback
              src={cover.url}
              alt={cover.alt ?? product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className="fa-solid fa-box-open text-4xl text-black/20" aria-hidden="true" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <CollectibleBadge isCollectible={product.is_collectible} isBlindBox={isBlindBox} />
          </div>
        </div>
        <div className="space-y-1 p-4">
          <h3 className="font-heading text-sm font-semibold">{product.title}</h3>
          <p className="text-sm text-black/70">{formatPrice(product.base_price, product.currency)}</p>
          {product.edition_size && (
            <StockCounter productId={product.id} editionSize={product.edition_size} />
          )}
        </div>
      </Card>
    </Link>
  );
}
