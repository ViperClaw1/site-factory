import type { Product } from "@repo/types";
import { ProductCard } from "./ProductCard";

export interface ProductGridProps {
  products: Product[];
}

// Limited editions get a wider tile to stand out in the grid — same signal
// ProductCard uses for its badge.
export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-black/50">No products found.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} featured={product.is_collectible} />
      ))}
    </div>
  );
}
