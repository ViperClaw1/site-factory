"use client";

import { buttonClass } from "@/components/buttons";
import { Shape } from "@/components/Shape";
import { unsplash } from "@/lib/catalog";
import { useT, type MessageKey } from "@/lib/i18n";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface Slide {
  n: 1 | 2 | 3;
  href: string;
  image: string;
  // Background, headline/body text, badge, CTA and the disc behind the photo.
  bg: string;
  text: string;
  badge: string;
  cta: "light" | "dark";
  disc: string;
  shapes: string;
}

// Three campaign slides, each with its own Memphis color world. Links point at
// showcase PDPs until real campaigns come from the CMS.
const SLIDES: Slide[] = [
  {
    n: 1,
    href: "/p/placeholder-1",
    image: unsplash("1775410632946-26f19376617e", 900),
    bg: "bg-pink",
    text: "text-white",
    badge: "bg-sun text-ink",
    cta: "light",
    disc: "text-[#FF6A45]",
    shapes: "text-white/15",
  },
  {
    n: 2,
    href: "/p/placeholder-4",
    image: unsplash("1779792495496-a26f748f57b0", 900),
    bg: "bg-sun",
    text: "text-ink",
    badge: "bg-pink text-white",
    cta: "dark",
    disc: "text-white/60",
    shapes: "text-ink/10",
  },
  {
    n: 3,
    href: "/p/placeholder-6",
    image: unsplash("1634828221818-503587f33d02", 900),
    bg: "bg-electric",
    text: "text-white",
    badge: "bg-sun text-ink",
    cta: "light",
    disc: "text-pink",
    shapes: "text-white/15",
  },
];

const INTERVAL_MS = 5000;

// Full-bleed auto-rotating hero: 5s per slide, pauses while hovered/focused,
// prev/next arrows and dot indicators.
export function HeroCarousel() {
  const { t } = useT();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index]!;

  const go = useCallback((delta: number) => {
    setIndex((current) => (current + delta + SLIDES.length) % SLIDES.length);
  }, []);

  // Autoplay — re-armed on every slide change, so manual navigation also
  // restarts the 5s countdown.
  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(() => go(1), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [index, paused, go]);

  const key = (suffix: "eyebrow" | "title" | "body") => `hero.${slide.n}.${suffix}` as MessageKey;
  const offset = reduceMotion ? 0 : 1;

  return (
    <section
      aria-roledescription="carousel"
      className={`relative overflow-hidden transition-colors duration-700 ${slide.bg}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Memphis decorations */}
      <div className={`transition-colors duration-700 ${slide.shapes}`}>
        <Shape kind="circle" className="-left-24 -top-24 h-72 w-72" />
        <Shape kind="triangle" className="right-[8%] top-10 h-24 w-24 animate-float-slow" />
        <Shape kind="square" className="left-[34%] top-20 h-4 w-4 rotate-12 !text-sun animate-float" />
        <Shape kind="circle" className="bottom-24 left-[10%] h-28 w-28" />
        <Shape kind="diamond" className="bottom-8 right-[4%] h-24 w-24 animate-float" />
        <Shape kind="dots" className="bottom-10 left-[42%] h-16 w-16" />
        <Shape kind="squiggle" className="right-[40%] top-6 h-10 w-24" />
        <Shape kind="circle" className="left-[3%] top-1/2 h-3 w-3 !text-sun" />
      </div>

      <div className="relative mx-auto grid min-h-[560px] max-w-7xl items-center gap-10 px-6 py-16 sm:px-10 md:grid-cols-2 lg:min-h-[640px] lg:px-16">
        {/* Copy */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.n}
            initial={{ opacity: 0, x: -40 * offset }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 * offset }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={slide.text}
          >
            <span className={`eyebrow inline-block px-2.5 py-1 !text-[10px] ${slide.badge}`}>{t(key("eyebrow"))}</span>
            <h1 className="font-display mt-5 max-w-xl text-5xl leading-[0.95] sm:text-6xl lg:text-[88px]">
              {t(key("title"))}
            </h1>
            <p className="mt-6 max-w-md text-base opacity-90 md:text-lg">{t(key("body"))}</p>
            <Link href={slide.href} className={buttonClass(slide.cta, "lg", "mt-8")}>
              {t("hero.cta")}
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Product photo on a colored disc */}
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <Shape kind="circle" className={`inset-[-6%] h-[112%] w-[112%] transition-colors duration-700 ${slide.disc}`} />
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.n}
              initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85, rotate: reduceMotion ? 0 : -6 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-[8%] overflow-hidden shadow-[12px_12px_0_0_rgba(17,17,17,0.9)]"
            >
              <Image src={slide.image} alt="" fill priority sizes="(min-width: 768px) 420px, 80vw" className="object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Prev / next */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={t("hero.prev")}
        className={`absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors hover:bg-black/10 ${slide.text}`}
      >
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label={t("hero.next")}
        className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center transition-colors hover:bg-black/10 ${slide.text}`}
      >
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>

      {/* Dot indicators — the active one stretches into a bar. */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.n}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={t("hero.goto", { n: i + 1 })}
            aria-current={i === index}
            className={`h-1.5 transition-all duration-300 ${
              i === index ? "w-8 bg-current" : "w-3 bg-current opacity-40 hover:opacity-70"
            } ${slide.text}`}
          />
        ))}
      </div>
    </section>
  );
}
