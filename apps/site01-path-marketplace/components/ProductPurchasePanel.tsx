"use client";

import { useCartStore } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { coverImage } from "@/lib/media";
import type { Product } from "@repo/types";
import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "./buttons";
import { FavoriteButton } from "./FavoriteButton";

export interface ProductPurchasePanelProps {
  product: Product;
  soldOut?: boolean;
}

// Client island: everything around it (title, description, gallery) is server
// rendered — only price formatting and "add to cart" need the browser stores.
export function ProductPurchasePanel({ product, soldOut = false }: ProductPurchasePanelProps) {
  const { t, price } = useT();
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.base_price,
      currency: product.currency,
      image: coverImage(product)?.url,
    });
    setAdded(true);
  }

  return (
    <div>
      <p className="font-display text-4xl text-pink">{price(product.base_price, product.currency)}</p>
      <div className="mt-6 flex items-center gap-3">
        {soldOut ? (
          <button type="button" disabled className={buttonClass("muted", "lg", "w-full sm:w-auto")}>
            {t("pdp.soldOut")}
          </button>
        ) : (
          <button type="button" onClick={handleAddToCart} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
            {t("pdp.addToCart")}
          </button>
        )}
        <FavoriteButton productId={product.id} className="h-[52px] w-[52px] shrink-0 border-2 border-ink text-lg" />
      </div>
      {added && (
        <p className="mt-3 text-sm text-black/70">
          {t("pdp.added")}{" "}
          <Link href="/cart" className="font-semibold text-pink underline">
            {t("pdp.viewCart")}
          </Link>
        </p>
      )}
    </div>
  );
}
