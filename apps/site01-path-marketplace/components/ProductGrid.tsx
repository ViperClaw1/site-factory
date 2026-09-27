import type { Product } from "@repo/types";
import type { CardItem } from "@/lib/catalog";
import { toCardItem } from "@/lib/to-card-item";
import { SHOWCASE_ITEMS } from "@/lib/placeholders";
import { EmptyState } from "./EmptyState";
import { ProductCard } from "./ProductCard";
import { RevealGrid } from "./RevealGrid";

export interface ProductGridProps {
  products: Product[];
  // Showcase items shown under the empty-state notice when `products` is
  // empty (defaults to the whole showcase catalog).
  fallbackItems?: CardItem[];
}

export const GRID_CLASSES = "grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4";

export function ProductGrid({ products, fallbackItems = SHOWCASE_ITEMS }: ProductGridProps) {
  // Empty catalog: say so, then preview the showcase items (real PDP links).
  if (products.length === 0) {
    return (
      <div>
        <EmptyState messageKey="empty.products" />
        <RevealGrid className={`${GRID_CLASSES} mt-8`}>
          {fallbackItems.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </RevealGrid>
      </div>
    );
  }

  return (
    <RevealGrid className={GRID_CLASSES}>
      {products.map((product) => (
        <ProductCard key={product.id} item={toCardItem(product)} />
      ))}
    </RevealGrid>
  );
}
