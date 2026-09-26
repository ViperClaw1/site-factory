"use client";

import { buttonClass } from "@/components/buttons";
import { cartTotal, useCartStore } from "@/lib/cart";
import { useT } from "@/lib/i18n";
import { Container } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function CheckoutPage() {
  const { t, price } = useT();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Placing an order clears the cart before navigating to the confirmation
  // page — without this flag, the "redirect to /cart when empty" effect
  // below would race that navigation and send the user to /cart instead.
  const [orderPlaced, setOrderPlaced] = useState(false);
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0 && !orderPlaced) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, orderPlaced, router]);

  if (!hydrated || items.length === 0) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setOrderPlaced(true);

    // Mock confirmation only — no payment processor is wired up yet. Real
    // payment (fiat + crypto via PayMesh Gateway, webhook-driven order
    // status, sync to the ops dashboard) is Phase 3 of ТЗ v2.0 and is
    // currently blocked on API keys from the Gateway team — see
    // specs/Implementation_Plan_v2.md.
    const order = {
      id: `mock_${Date.now().toString(36)}`,
      email,
      items,
      total: cartTotal(items),
      currency: items[0]?.currency ?? "USD",
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem("path-marketplace-last-order", JSON.stringify(order));
    clear();
    router.push(`/checkout/confirmation?order=${order.id}`);
  }

  return (
    <Container className="max-w-xl py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{t("checkout.title")}</h1>
      <p className="mt-4 border-l-4 border-pink bg-pink-soft p-3 text-xs leading-relaxed text-pink-dark">
        {t("checkout.notice")}
      </p>

      {/* Order summary */}
      <div className="mt-8 space-y-2 border-2 border-ink p-5">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between gap-4 text-sm">
            <span>
              {item.title} × {item.qty}
            </span>
            <span>{price(item.price * item.qty, item.currency)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-black/10 pt-3 font-semibold">
          <span>{t("checkout.total")}</span>
          <span className="text-pink">{price(cartTotal(items), items[0]?.currency ?? "USD")}</span>
        </div>
      </div>

      {/* Contact + submit */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="eyebrow text-ink">
            {t("checkout.email")}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full border-2 border-black/15 px-4 py-3 text-sm outline-none focus:border-pink"
            placeholder="you@example.com"
          />
        </div>
        <button type="submit" className={buttonClass("primary", "lg", "w-full")} disabled={submitting}>
          {submitting ? t("checkout.placing") : t("checkout.place")}
        </button>
      </form>
    </Container>
  );
}
