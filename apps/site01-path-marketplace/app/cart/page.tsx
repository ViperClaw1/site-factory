"use client";

import { buttonClass } from "@/components/buttons";
import { cartTotal, useCartStore } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { Container } from "@repo/ui";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartPage() {
  const { t, price } = useT();
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

  const qtyButton =
    "flex h-8 w-8 items-center justify-center border-2 border-ink text-sm font-bold transition-colors hover:bg-ink hover:text-white";

  return (
    <Container className="max-w-3xl py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{t("cart.title")}</h1>

      {items.length === 0 ? (
        /* Empty state */
        <div className="mt-10 flex flex-col items-center gap-4 bg-cream py-20 text-center">
          <i className="fa-solid fa-bag-shopping text-4xl text-pink" aria-hidden="true" />
          <p className="text-black/60">{t("cart.empty")}</p>
          <Link href="/shop" className={buttonClass("primary", "md", "mt-2")}>
            {t("cart.browse")}
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          {/* Line items */}
          <ul className="divide-y divide-black/10 border-y border-black/10">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-5">
                <Link href={`/p/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden bg-black/5">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <i className="fa-solid fa-box-open text-xl text-black/20" aria-hidden="true" />
                    </span>
                  )}
                </Link>
                <div className="flex-1">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="text-sm text-black/50">{price(item.price, item.currency)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={qtyButton}
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                    aria-label={t("cart.decrease", { title: item.title })}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    className={qtyButton}
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                    aria-label={t("cart.increase", { title: item.title })}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className="ml-2 text-black/35 transition-colors hover:text-pink"
                  onClick={() => removeItem(item.productId)}
                  aria-label={t("cart.remove", { title: item.title })}
                >
                  <i className="fa-solid fa-trash" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          {/* Subtotal + checkout */}
          <div className="mt-6 flex items-center justify-between">
            <p className="font-display text-2xl">{t("cart.subtotal")}</p>
            <p className="font-display text-2xl text-pink">{price(cartTotal(items), items[0]?.currency ?? "USD")}</p>
          </div>
          <Link href="/checkout" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("cart.checkout")}
          </Link>
        </div>
      )}
    </Container>
  );
}
