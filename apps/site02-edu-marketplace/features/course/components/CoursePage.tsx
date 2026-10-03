"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { addToCart, useCartIds } from "@/features/cart/store";
import {
  INCLUDED,
  LEARNING_OUTCOMES,
  PROGRAM,
  type StaticCourse,
} from "@/features/course/static-catalog";

export function CoursePage({ course }: { course: StaticCourse }) {
  const cart = useCartIds();
  const inCart = cart.includes(course.id);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addToCart(course.id);
    setAdded(true);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <Link href="/courses" className="text-sm text-white/55 transition hover:text-white">
        ← Back to courses
      </Link>

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={course.photo}
              alt=""
              width={1400}
              height={780}
              className="aspect-[16/9] w-full object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
            <div className="absolute bottom-0 p-6 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Career track</p>
              <h1 className="mt-2 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">{course.title}</h1>
            </div>
          </div>

          <div className="mt-8 max-w-3xl">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">Become a job-ready developer</h2>
            <p className="mt-3 text-white/60">
              Build production-grade skills through hands-on practice, mentor reviews, and real-world projects.
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10">
            {[
              [course.learners.toLocaleString("en-US"), "learners"],
              [String(course.months), "months"],
              ["5", "portfolio projects"],
            ].map(([value, label]) => (
              <div key={label} className="border-white/10 px-4 py-5 sm:px-6 [&:not(:first-child)]:border-l">
                <dt className="font-heading text-2xl font-extrabold sm:text-3xl">{value}</dt>
                <dd className="mt-1 text-sm text-white/45">{label}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-12">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">What you will learn</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {LEARNING_OUTCOMES.map((item) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-white/10 px-4 py-4 text-sm text-white/80">
                  <span className="text-brand" aria-hidden>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">Program</h2>
            <p className="mt-2 text-white/55">A practical curriculum built with senior industry experts.</p>
            <ol className="mt-6 space-y-4">
              {PROGRAM.map((module, index) => (
                <li key={module.title} className="rounded-2xl border border-white/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-1 font-heading text-xl font-bold">{module.title}</h3>
                  <ul className="mt-3 space-y-1 text-sm text-white/55">
                    {module.lessons.map((lesson) => (
                      <li key={lesson}>{lesson}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
          <p className="text-sm text-white/45">Course details</p>
          <p className="mt-2 font-heading text-5xl font-extrabold tracking-tight">${course.price}</p>
          <button
            type="button"
            onClick={handleAdd}
            className="mt-5 h-12 w-full rounded-full bg-brand text-sm font-bold text-ink transition hover:bg-brand-dark"
          >
            {inCart || added ? "Added to cart" : "Add to cart"}
          </button>
          <Link
            href={`/learn/${course.id}`}
            className="mt-3 flex h-12 w-full items-center justify-center rounded-full border border-white/15 text-sm font-semibold transition hover:border-white/40"
          >
            Start learning
          </Link>
          <p className="mt-8 text-sm font-semibold">What is included</p>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-brand" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm capitalize text-white/45">
            {course.level} · {course.category}
          </p>
          <p className="mt-2 text-sm text-white/55">{course.summary}</p>
        </aside>
      </div>
    </div>
  );
}
