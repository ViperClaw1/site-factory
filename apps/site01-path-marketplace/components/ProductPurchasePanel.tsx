"use client";

import { useCartStore } from "@/lib/cart";
import { formatPrice } from "@repo/lib";
import { Button } from "@repo/ui";
import type { Product } from "@repo/types";
import Link from "next/link";
import { useState } from "react";

export interface ProductPurchasePanelProps {
  product: Product;
}

// Client island: everything above (title, description, gallery) is server
// rendered — only "add to cart" needs the browser-only Zustand store.
export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.base_price,
      currency: product.currency,
      image: product.images[0]?.url,
    });
    setAdded(true);
  }

  return (
    <div>
      <p className="text-lg font-semibold">{formatPrice(product.base_price, product.currency)}</p>
      <Button className="mt-6" onClick={handleAddToCart}>
        Add to Cart
      </Button>
      {added && (
        <p className="mt-3 text-sm text-black/70">
          Added to cart.{" "}
          <Link href="/cart" className="font-medium text-[var(--color-primary)] underline">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}
