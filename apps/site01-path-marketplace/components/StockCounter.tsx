"use client";

import { createSupabaseBrowserClient } from "@repo/lib";
import { useEffect, useState } from "react";

export interface StockCounterProps {
  productId: string;
  editionSize?: number | null;
}

export function StockCounter({ productId, editionSize }: StockCounterProps) {
  const [stock, setStock] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Sum current stock across every variant of this product.
    async function loadStock() {
      const { data } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("product_id", productId);
      const total = (data ?? []).reduce((sum: number, row: { stock: number }) => sum + row.stock, 0);
      setStock(total);
    }

    loadStock();

    // Keep the total live — any insert/update/delete on this product's
    // variants (e.g. a purchase decrementing stock) re-triggers the sum.
    const channel = supabase
      .channel(`product-variants-${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "product_variants",
          filter: `product_id=eq.${productId}`,
        },
        () => loadStock()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  if (stock === null) return null;

  if (editionSize) {
    const sold = editionSize - stock;
    return (
      <p className="text-xs text-black/60">
        {sold} claimed · {stock} remaining · Edition of {editionSize}
      </p>
    );
  }

  if (stock === 0) {
    return <p className="text-xs font-semibold text-red-600">Sold out</p>;
  }

  return <p className="text-xs text-black/60">{stock} in stock</p>;
}
