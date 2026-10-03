"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { clearCart, useCartIds } from "@/features/cart/store";
import { STATIC_COURSES } from "@/features/course/static-catalog";

export function CheckoutForm() {
  const ids = useCartIds();
  const items = ids
    .map((id) => STATIC_COURSES.find((course) => course.id === id))
    .filter((course): course is (typeof STATIC_COURSES)[number] => Boolean(course));
  const total = items.reduce((sum, course) => sum + course.price, 0);
  const [paid, setPaid] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0) return;
    clearCart();
    setPaid(true);
  }

  if (paid) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Enrolled</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight">You are in.</h1>
        <p className="mt-3 text-white/60">Your courses are ready. Open your profile to continue learning.</p>
        <Link
          href="/profile"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-ink"
        >
          Go to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">Checkout</h1>
      <p className="mt-3 text-white/55">One last step before your next chapter.</p>

      {items.length === 0 ? (
        <p className="mt-10 text-white/60">
          Your cart is empty.{" "}
          <Link href="/courses" className="text-brand">
            Browse courses
          </Link>
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-8 rounded-3xl border border-white/10 p-6 sm:p-8">
            <fieldset className="space-y-3">
              <legend className="font-heading text-xl font-bold">Contact information</legend>
              <label className="block text-sm text-white/70">
                Email address
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="alex@example.com"
                  className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
                />
              </label>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="font-heading text-xl font-bold">Payment details</legend>
              <label className="block text-sm text-white/70">
                Name on card
                <input
                  required
                  name="name"
                  placeholder="Alex Morgan"
                  className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm text-white/70">
                Card number
                <input
                  required
                  inputMode="numeric"
                  name="card"
                  placeholder="4242 4242 4242 4242"
                  className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm text-white/70">
                  Expiry
                  <input
                    required
                    name="expiry"
                    placeholder="MM / YY"
                    className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm text-white/70">
                  CVC
                  <input
                    required
                    name="cvc"
                    placeholder="CVC"
                    className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-transparent px-4 outline-none focus:border-brand"
                  />
                </label>
              </div>
            </fieldset>

            <p className="text-sm text-white/45">Your payment is encrypted and secure.</p>
            <button
              type="submit"
              className="h-12 w-full rounded-full bg-brand text-sm font-bold text-ink transition hover:bg-brand-dark"
            >
              Pay and enroll
            </button>
          </div>

          <aside className="rounded-3xl border border-white/10 p-6">
            <h2 className="font-heading text-2xl font-extrabold">Order summary</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {items.map((course) => (
                <li key={course.id} className="flex justify-between gap-4">
                  <span className="text-white/75">{course.title}</span>
                  <span>${course.price}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-6 space-y-3 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between text-white/60">
                <dt>Subtotal</dt>
                <dd>${total}</dd>
              </div>
              <div className="flex justify-between text-brand">
                <dt>Learning discount</dt>
                <dd>−$0</dd>
              </div>
              <div className="flex items-end justify-between border-t border-white/10 pt-4">
                <dt className="font-semibold">Total</dt>
                <dd className="font-heading text-3xl font-extrabold">${total}</dd>
              </div>
            </dl>
          </aside>
        </form>
      )}
    </div>
  );
}
