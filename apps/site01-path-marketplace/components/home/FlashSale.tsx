"use client";

import { buttonClass } from "@/components/buttons";
import { CatalogImage } from "@/components/CatalogImage";
import { useAddToCart } from "@/components/ProductCard";
import { Shape } from "@/components/Shape";
import { useT } from "@/lib/i18n";
import { productHeading } from "@/lib/catalog";
import { circularCountdown, freshSaleIndex, type FreshSaleDeal } from "@/lib/placeholders";
import Link from "next/link";
import { useEffect, useState } from "react";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function DealPanel({ deal }: { deal: FreshSaleDeal }) {
  const { t, price } = useT();
  const { item } = deal;
  const { add, added } = useAddToCart(item, true);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(circularCountdown(deal.countdownSeconds, Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deal.countdownSeconds]);

  const compareAt = item.compareAt ?? item.price;
  const percentOff = Math.round((1 - item.price / compareAt) * 100);
  const units =
    remaining === null
      ? null
      : [Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60];
  const labels = [t("flash.hrs"), t("flash.min"), t("flash.sec")];

  return (
    <div className="relative grid items-center gap-12 md:grid-cols-2">
      <div>
        <p className="eyebrow flex items-center gap-2 text-pink">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-pink" aria-hidden="true" />
          {t("flash.eyebrow")}
        </p>
        <h2 className="font-display mt-3 text-4xl md:text-5xl">
          <Link href={`/p/${item.slug}`} className="hover:text-pink">
            {productHeading(item.title, item.character)}
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
            <div key={label} className="flex items-start gap-3">
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
  );
}

// Dark fresh-sale band. The featured deal follows the local day (switches at
// FRESH_SALE_SWITCH_HOUR); arrows walk the same list in a circle. Each deal's
// countdown loops on its own length until real end dates exist.
export function FlashSale({ deals }: { deals: FreshSaleDeal[] }) {
  const { t } = useT();
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setScheduled(freshSaleIndex(new Date(), deals.length));
    sync();
    const timer = setInterval(sync, 30_000);
    return () => clearInterval(timer);
  }, [deals.length]);

  if (deals.length === 0) return null;

  const active = picked ?? scheduled ?? 0;
  const deal = deals[active]!;
  const count = deals.length;

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white">
      <Shape kind="square" className="left-[4%] top-10 h-16 w-16 rotate-12 text-white/5" />
      <Shape kind="circle" className="-right-24 bottom-[-6rem] h-96 w-96 text-pink/15" />
      <Shape kind="circle" className="right-[30%] top-6 h-24 w-24 text-electric/20" />
      <Shape kind="triangle" className="bottom-12 left-[32%] h-12 w-12 text-sun/20 animate-float" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <DealPanel key={deal.item.id} deal={deal} />

        {count > 1 && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label={t("flash.prev")}
              onClick={() => setPicked((active - 1 + count) % count)}
              className="flex h-10 w-10 items-center justify-center border border-white/25 text-lg transition-colors hover:border-white hover:bg-white hover:text-ink"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {deals.map((entry, i) => (
                <button
                  key={entry.item.id}
                  type="button"
                  aria-label={entry.item.title}
                  aria-current={i === active ? "true" : undefined}
                  onClick={() => setPicked(i)}
                  className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-pink" : "bg-white/30 hover:bg-white/60"}`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label={t("flash.next")}
              onClick={() => setPicked((active + 1) % count)}
              className="flex h-10 w-10 items-center justify-center border border-white/25 text-lg transition-colors hover:border-white hover:bg-white hover:text-ink"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
