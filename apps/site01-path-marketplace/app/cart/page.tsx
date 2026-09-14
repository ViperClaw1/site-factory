"use client";

import { cartTotal, useCartStore } from "@/lib/cart";
import { formatPrice } from "@repo/lib";
import { Button, Container, Section } from "@repo/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  // Avoid flashing an "empty cart" state before localStorage has loaded.
  if (!hydrated) return null;

  return (
    <Section>
      <Container className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold">Your Cart</h1>

        {items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-16 text-center text-black/50">
            <i className="fa-solid fa-cart-shopping text-3xl text-black/20" aria-hidden="true" />
            <p className="text-sm">Your cart is empty.</p>
            <Link href="/shop">
              <Button className="mt-2">Browse the shop</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 rounded-2xl border border-black/5 p-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/5">
                  <i className="fa-solid fa-box-open text-xl text-black/20" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-heading text-sm font-semibold">{item.title}</p>
                  <p className="text-sm text-black/50">{formatPrice(item.price, item.currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-black/10 text-sm"
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    aria-label={`Decrease quantity of ${item.title}`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm">{item.qty}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full border border-black/10 text-sm"
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    aria-label={`Increase quantity of ${item.title}`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="text-black/40 hover:text-[var(--color-primary)]"
                  onClick={() => removeItem(item.productId)}
                  aria-label={`Remove ${item.title} from cart`}
                >
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-black/10 pt-4">
              <p className="font-heading text-lg font-semibold">Subtotal</p>
              <p className="font-heading text-lg font-semibold">
                {formatPrice(cartTotal(items), items[0]?.currency ?? "USD")}
              </p>
            </div>

            <Link href="/checkout">
              <Button className="w-full">Checkout</Button>
            </Link>
          </div>
        )}
      </Container>
    </Section>
  );
}
