"use client";

import { useAuthStore } from "@/lib/auth";
import { productHeading, type BadgeKind, type CardItem } from "@/lib/catalog";
import { useCartStore } from "@/lib/cart";
import { useT, type MessageKey } from "@/lib/i18n";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { buttonClass } from "./buttons";
import { CatalogImage } from "./CatalogImage";
import { FavoriteButton } from "./FavoriteButton";
import { StockCounter } from "./StockCounter";

const BADGE_STYLES: Record<BadgeKind, { key: MessageKey; className: string }> = {
  hot: { key: "badge.hot", className: "bg-pink text-white" },
  new: { key: "badge.new", className: "bg-electric text-white" },
  limited: { key: "badge.limited", className: "bg-ink text-white" },
  digital: { key: "badge.digital", className: "bg-sun text-ink" },
  blindbox: { key: "badge.blindbox", className: "bg-pink-dark text-white" },
};

export function ItemBadge({ kind, className = "" }: { kind: BadgeKind; className?: string }) {
  const { t } = useT();
  const style = BADGE_STYLES[kind];
  return (
    <span className={`eyebrow inline-block px-2 py-1 !text-[9px] ${style.className} ${className}`}>
      {t(style.key)}
    </span>
  );
}

// Guests on gated surfaces (the home page) go to login instead of mutating the cart.
function useGuestLoginRedirect(enabled: boolean) {
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const pathname = usePathname();

  return function redirectIfGuest(): boolean {
    if (!enabled || role !== "guest") return false;
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return true;
  };
}

// Adds a card item to the cart with a short "Added ✓" confirmation state.
export function useAddToCart(item: CardItem, authGate = false) {
  const addItem = useCartStore((state) => state.addItem);
  const redirectIfGuest = useGuestLoginRedirect(authGate);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);

  function add(): boolean {
    if (redirectIfGuest()) return false;
    addItem({
      productId: item.id,
      slug: item.slug,
      title: productHeading(item.title, item.character),
      price: item.price,
      currency: item.currency,
      image: item.image,
    });
    setAdded(true);
    return true;
  }

  return { add, added };
}

export interface ProductCardProps {
  item: CardItem;
  // Tighter type scale for the 6-column "New Arrivals" strip.
  compact?: boolean;
  // Logged-out add-to-cart / buy-now opens /login (AuthForm) instead of the cart.
  authGate?: boolean;
}

// Square image with badge + hover-reveal "Add to Cart" bar, then character /
// title / subtitle / price and a "Buy Now" button (adds, then opens the cart).
export function ProductCard({ item, compact = false, authGate = false }: ProductCardProps) {
  const { t, price } = useT();
  const router = useRouter();
  const { add, added } = useAddToCart(item, authGate);
  const href = `/p/${item.slug}`;
  const heading = productHeading(item.title, item.character);

  function buyNow() {
    if (!add()) return;
    router.push("/cart");
  }

  return (
    <article className="group flex h-full flex-col">
      {/* Image + badge + hover CTA */}
      <div className="relative aspect-square overflow-hidden bg-black/[0.04]">
        <Link href={href} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {item.image ? (
            <CatalogImage
              src={item.image}
              alt={item.imageAlt ?? item.title}
              sizes={compact ? "(min-width: 1024px) 16vw, 50vw" : "(min-width: 1024px) 25vw, 50vw"}
              variants={item.imageVariants}
              version={item.imageVersion}
              blurDataUrl={item.imageBlurDataUrl}
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                item.soldOut ? "opacity-40 grayscale" : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <i className="fa-solid fa-box-open text-4xl text-black/15" aria-hidden="true" />
            </div>
          )}
        </Link>

        {item.badge && !item.soldOut && <ItemBadge kind={item.badge} className="absolute left-2.5 top-2.5" />}
        <FavoriteButton productId={item.id} className="absolute right-2 top-2" />

        {item.soldOut ? (
          <span className="eyebrow pointer-events-none absolute inset-0 flex items-center justify-center text-black/50">
            {t("card.soldOut")}
          </span>
        ) : (
          <button
            type="button"
            onClick={add}
            className={`absolute inset-x-0 bottom-0 translate-y-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 focus:translate-y-0 group-hover:translate-y-0 ${
              added ? "bg-electric" : "bg-ink hover:bg-pink"
            }`}
          >
            {added ? t("card.added") : t("card.addToCart")}
          </button>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-1 flex-col pt-3">
        {item.character && <p className="eyebrow !text-[9px] text-black/40">{item.character}</p>}
        <h3 className={`mt-1 font-semibold leading-snug text-ink ${compact ? "text-xs" : "text-sm"}`}>
          <Link href={href} className="transition-colors hover:text-pink">
            {heading}
          </Link>
        </h3>
        {item.subtitle && <p className="mt-0.5 text-[11px] text-black/40">{item.subtitle}</p>}
        {item.editionSize && !item.id.startsWith("placeholder-") && (
          <div className="mt-1">
            <StockCounter productId={item.id} editionSize={item.editionSize} />
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <p className={`font-bold text-ink ${compact ? "text-xs" : "text-sm"}`}>{price(item.price, item.currency)}</p>
          {item.soldOut ? (
            <button type="button" disabled className={buttonClass("muted", "sm", "!opacity-100")}>
              {t("card.notifyMe")}
            </button>
          ) : (
            <button type="button" onClick={buyNow} className={buttonClass("primary", "sm")}>
              {t("card.buyNow")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
