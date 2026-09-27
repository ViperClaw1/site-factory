"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "@repo/ui";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { STATS } from "../data";

const DURATION_MS = 1800;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

// Counts from 0 to `value` once the number scrolls into view.
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCurrent(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / DURATION_MS);
          setCurrent(Math.round(value * easeOutCubic(progress)));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {current}
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  const { t } = useI18n();

  return (
    <section className="py-8">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] bg-brand px-6 py-14 text-ink sm:px-12 lg:py-16">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/60">{t.stats.eyebrow}</p>
            <h2 className="mt-3 max-w-xl font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t.stats.title}
            </h2>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
              {STATS.map((stat, i) => (
                <div key={i} className="border-l-2 border-ink/15 pl-5">
                  <dt className="sr-only">{t.stats.items[i]}</dt>
                  <dd className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                    <Counter value={stat.value} suffix={stat.suffix} />
                  </dd>
                  <dd className="mt-2 text-sm font-medium leading-snug text-ink/70">{t.stats.items[i]}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Container>
    </section>
  );
}
