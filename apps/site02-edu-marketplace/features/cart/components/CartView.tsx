"use client";

import Image from "next/image";
import Link from "next/link";
import { removeFromCart, useCartIds } from "@/features/cart/store";
import { STATIC_COURSES } from "@/features/course/static-catalog";

export function CartView() {
  const ids = useCartIds();
  const items = ids
    .map((id) => STATIC_COURSES.find((course) => course.id === id))
    .filter((course): course is (typeof STATIC_COURSES)[number] => Boolean(course));
  const total = items.reduce((sum, course) => sum + course.price, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-5xl font-extrabold tracking-tight sm:text-6xl">Your cart</h1>
      <p className="mt-3 text-white/55">Review your learning plan before checkout.</p>

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-3xl border border-white/10 px-6 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-2xl font-bold text-ink">+</span>
          <p className="mt-6 font-heading text-2xl font-bold">Your cart is waiting for a new skill.</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-bold text-ink transition hover:bg-brand-dark"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ul className="space-y-4">
            {items.map((course) => (
              <li key={course.id} className="flex gap-4 rounded-3xl border border-white/10 p-4">
                <Image src={course.photo} alt="" width={160} height={112} className="h-24 w-32 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <Link href={`/course/${course.id}`} className="font-heading text-lg font-bold hover:text-brand">
                    {course.title}
                  </Link>
                  <p className="mt-1 text-sm capitalize text-white/45">{course.level}</p>
                  <p className="mt-3 font-heading text-xl font-extrabold">${course.price}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(course.id)}
                  className="self-start text-sm text-white/45 transition hover:text-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <aside className="rounded-3xl border border-white/10 p-6">
            <p className="text-sm text-white/45">Subtotal</p>
            <p className="mt-1 font-heading text-4xl font-extrabold">${total}</p>
            <Link
              href="/checkout"
              className="mt-6 flex h-12 items-center justify-center rounded-full bg-brand text-sm font-bold text-ink transition hover:bg-brand-dark"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
