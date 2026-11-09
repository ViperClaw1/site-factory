"use client";

import { buttonClass } from "@/components/buttons";
import { Shape } from "@/components/Shape";
import type { CartItem } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { Container } from "@repo/ui";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MockOrder {
  id: string;
  email: string;
  items: CartItem[];
  total: number;
  currency: string;
  createdAt: string;
}

export default function CheckoutConfirmationPage() {
  const { t, price } = useT();
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("path-marketplace-last-order");
    if (raw) setOrder(JSON.parse(raw));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  // No order in this session (e.g. page opened directly).
  if (!order) {
    return (
      <Container className="max-w-xl py-20 text-center">
        <i className="fa-solid fa-circle-question text-4xl text-black/20" aria-hidden="true" />
        <p className="mt-4 text-black/70">{t("confirm.none")}</p>
        <Link href="/shop" className={buttonClass("primary", "md", "mt-6")}>
          {t("confirm.back")}
        </Link>
      </Container>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <Shape kind="circle" className="-left-20 top-10 h-52 w-52 text-sun/40" />
      <Shape kind="triangle" className="right-[10%] top-24 h-16 w-16 text-electric/40 animate-float" />
      <Shape kind="dots" className="bottom-10 right-6 h-20 w-20 text-pink/30" />

      <Container className="relative max-w-xl py-16 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink text-2xl text-white">
          <i className="fa-solid fa-check" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-6 text-4xl text-ink md:text-5xl">{t("confirm.title")}</h1>
        <p className="mt-3 text-black/70">
          {t("confirm.sentTo")} <strong>{order.email}</strong>.
        </p>
        <p className="eyebrow mt-2 text-black/40">{t("confirm.order", { id: order.id })}</p>

        {/* Order summary */}
        <div className="mt-8 space-y-2 border-2 border-ink bg-white p-5 text-left">
          {order.items.map((item) => (
            <div key={item.productId} className="flex justify-between gap-4 text-sm">
              <span>
                {item.title} × {item.qty}
              </span>
              <span>{price(item.price * item.qty, item.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-black/10 pt-3 font-semibold">
            <span>{t("checkout.total")}</span>
            <span className="text-pink">{price(order.total, order.currency)}</span>
          </div>
        </div>

        <p className="mt-6 border-l-4 border-pink bg-pink-soft p-3 text-left text-xs leading-relaxed text-pink-dark">
          {t("confirm.notice")}
        </p>

        <Link href="/shop" className={buttonClass("outline", "md", "mt-8")}>
          {t("confirm.continue")}
        </Link>
      </Container>
    </div>
  );
}
