"use client";

import { cartTotal, useCartStore } from "@/lib/cart";
import { formatPrice } from "@repo/lib";
import { Button, Container, Section } from "@repo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function CheckoutPage() {
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
    // obsidian-docs/site-factory/specs/Implementation_Plan_v2.md.
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
    <Section>
      <Container className="max-w-xl">
        <h1 className="font-heading text-3xl font-bold">Checkout</h1>
        <p className="mt-3 rounded-xl bg-[var(--color-primary)]/10 p-3 text-xs text-[var(--color-primary-dark)]">
          Payment is not wired up yet — placing an order here only mocks a confirmation, nothing is
          charged. Real payment (fiat and crypto via PayMesh Gateway) lands in a later phase.
        </p>

        <div className="mt-6 space-y-2 rounded-2xl border border-black/5 p-4">
          {items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.title} × {item.qty}
              </span>
              <span>{formatPrice(item.price * item.qty, item.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-black/10 pt-2 font-heading font-semibold">
            <span>Total</span>
            <span>{formatPrice(cartTotal(items), items[0]?.currency ?? "USD")}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 px-4 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Placing order…" : "Place order"}
          </Button>
        </form>
      </Container>
    </Section>
  );
}
