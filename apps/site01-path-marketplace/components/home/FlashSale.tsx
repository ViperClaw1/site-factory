"use client";

import { buttonClass } from "@/components/buttons";
import { useAddToCart } from "@/components/ProductCard";
import { Shape } from "@/components/Shape";
import type { CardItem } from "@/lib/catalog";
import { useT } from "@/lib/i18n";
import { CatalogImage } from "@/components/CatalogImage";
import Link from "next/link";
import { useEffect, useState } from "react";

// Seconds left until local midnight — the sale "resets" daily.
function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// Dark flash-sale band: product copy, sale vs. original price, a live
// HH:MM:SS countdown, and the photo with a % off badge.
export function FlashSale({ item }: { item: CardItem }) {
  const { t, price } = useT();
  const { add, added } = useAddToCart(item);
  // null until mounted: the countdown depends on the viewer's clock, so the
  // server renders "--" placeholders instead of a mismatching time.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(secondsUntilMidnight());
    const timer = setInterval(() => setRemaining(secondsUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  const compareAt = item.compareAt ?? item.price;
  const percentOff = Math.round((1 - item.price / compareAt) * 100);
  const units =
    remaining === null
      ? null
      : [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60];
  const labels = [t("flash.hrs"), t("flash.min"), t("flash.sec")];

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white">
      {/* Memphis decorations */}
      <Shape kind="square" className="left-[4%] top-10 h-16 w-16 rotate-12 text-white/5" />
      <Shape kind="circle" className="-right-24 bottom-[-6rem] h-96 w-96 text-pink/15" />
      <Shape kind="circle" className="right-[30%] top-6 h-24 w-24 text-electric/20" />
      <Shape kind="triangle" className="bottom-12 left-[32%] h-12 w-12 text-sun/20 animate-float" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
        {/* Copy, prices, countdown, CTA */}
        <div>
          <p className="eyebrow flex items-center gap-2 text-pink">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-pink" aria-hidden="true" />
            {t("flash.eyebrow")}
          </p>
          <h2 className="font-display mt-3 text-4xl md:text-5xl">
            <Link href={`/p/${item.slug}`} className="hover:text-pink">
              {item.title}
            </Link>
          </h2>
          <p className="mt-2 text-sm text-white/50">
            {item.character} · {item.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl text-pink md:text-5xl">{price(item.price, item.currency)}</span>
            <span className="text-lg text-white/40 line-through">{price(compareAt, item.currency)}</span>
            <span className="bg-pink/20 px-2 py-1 text-[11px] font-semibold text-pink">
              {t("flash.save", { amount: price(compareAt - item.price, item.currency) })}
            </span>
          </div>

          <p className="eyebrow mt-8 text-white/50">{t("flash.endsIn")}</p>
          <div className="mt-3 flex items-start gap-3" aria-live="off">
            {labels.map((label, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="text-center">
                  <span className="font-display flex h-16 w-16 items-center justify-center border-2 border-white/20 text-3xl tabular-nums">
                    {units ? pad(units[i]!) : "--"}
                  </span>
                  <span className="mt-1.5 block text-[10px] font-semibold tracking-widest text-white/40">{label}</span>
                </div>
                {i < 2 && <span className="font-display pt-3 text-2xl text-white/30">:</span>}
              </div>
            ))}
          </div>

          <button type="button" onClick={add} className={buttonClass(added ? "light" : "primary", "lg", "mt-10")}>
            {added ? t("card.added") : t("card.addToCart")}
          </button>
        </div>

        {/* Photo + % off badge */}
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <Shape kind="ring" className="-inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] text-pink/25 animate-spin-slow" />
          <div className="relative h-full w-full overflow-hidden bg-white">
            {item.image && (
              <CatalogImage
                src={item.image}
                alt={item.imageAlt ?? item.title}
                sizes="384px"
                variants={item.imageVariants}
                version={item.imageVersion}
                blurDataUrl={item.imageBlurDataUrl}
                className="object-cover"
              />
            )}
          </div>
          <span className="font-display absolute -right-4 -top-4 rotate-6 bg-pink px-3 py-2 text-2xl text-white shadow-[4px_4px_0_0_#FFC62B]">
            −{percentOff}%
          </span>
        </div>
      </div>
    </section>
  );
}
