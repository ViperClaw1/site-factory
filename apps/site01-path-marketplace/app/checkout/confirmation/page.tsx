"use client";

import type { CartItem } from "@/lib/cart";
import { formatPrice } from "@repo/lib";
import { Button, Container, Section } from "@repo/ui";
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
  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("path-marketplace-last-order");
    if (raw) setOrder(JSON.parse(raw));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!order) {
    return (
      <Section>
        <Container className="max-w-xl text-center">
          <i className="fa-solid fa-circle-question text-3xl text-black/20" aria-hidden="true" />
          <p className="mt-4 text-black/70">No recent order found.</p>
          <Link href="/shop">
            <Button className="mt-4">Back to shop</Button>
          </Link>
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container className="max-w-xl text-center">
        <i className="fa-solid fa-circle-check text-4xl text-[var(--color-primary)]" aria-hidden="true" />
        <h1 className="mt-4 font-heading text-3xl font-bold">Order confirmed</h1>
        <p className="mt-2 text-black/70">
          A confirmation would be sent to <strong>{order.email}</strong>.
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-black/40">Order {order.id}</p>

        <div className="mt-6 space-y-2 rounded-2xl border border-black/5 p-4 text-left">
          {order.items.map((item) => (
            <div key={item.productId} className="flex justify-between text-sm">
              <span>
                {item.title} × {item.qty}
              </span>
              <span>{formatPrice(item.price * item.qty, item.currency)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-black/10 pt-2 font-heading font-semibold">
            <span>Total</span>
            <span>{formatPrice(order.total, order.currency)}</span>
          </div>
        </div>

        <p className="mt-6 rounded-xl bg-[var(--color-primary)]/10 p-3 text-xs text-[var(--color-primary-dark)]">
          This is a mock confirmation — no payment was charged. Real payment processing, including
          success and failure scenarios, will be tested once the PayMesh Gateway integration lands.
        </p>

        <Link href="/shop">
          <Button variant="secondary" className="mt-6">
            Continue shopping
          </Button>
        </Link>
      </Container>
    </Section>
  );
}
