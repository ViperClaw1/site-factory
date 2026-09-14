"use client";

import { useCartStore } from "@/lib/cart";
import Link from "next/link";
import { useEffect, useState } from "react";

// The only nav in the app — needed once /cart exists, otherwise there'd be
// no way to reach the cart except the "View cart" link after adding an item.
export function SiteHeader() {
  const [hydrated, setHydrated] = useState(false);
  const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-black/5 bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-lg font-bold">
          Path Marketplace
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/shop" className="hidden hover:text-[var(--color-primary)] sm:inline">
            Shop
          </Link>
          <Link href="/collections" className="hidden hover:text-[var(--color-primary)] sm:inline">
            Collections
          </Link>
          <Link href="/characters" className="hidden hover:text-[var(--color-primary)] sm:inline">
            Characters
          </Link>
          <Link href="/cart" className="relative flex items-center gap-1.5 hover:text-[var(--color-primary)]" aria-label="Cart">
            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
            {hydrated && itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
