import type { Product } from "@repo/types";
import { EmptyState } from "./EmptyState";
import { PlaceholderCard, placeholderIcon } from "./PlaceholderCard";
import { ProductCard } from "./ProductCard";
import { RevealGrid } from "./RevealGrid";

export interface ProductGridProps {
  products: Product[];
}

const GRID_CLASSES = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4";

// Limited editions get a wider tile to stand out in the grid — same signal
// ProductCard uses for its badge.
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div>
        <EmptyState message="No products yet — check back soon." />
        <RevealGrid className={`${GRID_CLASSES} mt-6`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <PlaceholderCard key={index} icon={placeholderIcon(index)} />
          ))}
        </RevealGrid>
      </div>
    );
  }

  return (
    <RevealGrid className={GRID_CLASSES}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} featured={product.is_collectible} />
      ))}
    </RevealGrid>
  );
}
