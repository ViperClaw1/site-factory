"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "@repo/ui";
import { ArrowRightIcon, PlayIcon, StarIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { TESTIMONIALS, unsplash } from "../data";
import { HeroVisual } from "./HeroVisual";

export function LandingHero() {
  const { t } = useI18n();

  return (
    // Pulled up under the sticky header so the header is transparent over the hero backdrop.
    <section className="relative -mt-[72px] overflow-hidden pb-20 pt-[128px] lg:pb-28 lg:pt-[152px]">
      {/* ---- Backdrop: grid + yellow glow ---- */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="anim-glow pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 h-[380px] w-[380px] rounded-full bg-[#6C5CE7]/15 blur-[120px]"
      />

      <Container className="relative grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        {/* ---- Copy column ---- */}
        <div>
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/80 sm:text-sm">
            <span className="anim-ping h-2 w-2 rounded-full bg-brand" />
            {t.hero.badge}
          </p>

          <h1 className="mt-7 font-heading text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl xl:text-[4.25rem]">
            {t.hero.titleA}{" "}
            {/* text-decoration follows each wrapped line, unlike an absolutely positioned SVG */}
            <span className="text-brand underline decoration-brand/40 decoration-[3px] underline-offset-[10px]">
              {t.hero.titleB}
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{t.hero.subtitle}</p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="#courses"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-brand px-7 text-base font-bold text-ink shadow-[0_10px_40px_-10px_rgba(255,221,45,0.6)] transition hover:bg-brand-dark"
            >
              {t.hero.ctaPrimary}
              <ArrowRightIcon className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#how"
              className="inline-flex h-14 items-center gap-3 rounded-full border border-white/15 px-6 text-base font-semibold transition hover:border-white/40 hover:bg-white/5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10">
                <PlayIcon className="h-3.5 w-3.5 fill-current" />
              </span>
              {t.hero.ctaSecondary}
            </Link>
          </div>

          {/* ---- Social proof ---- */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {TESTIMONIALS.map((person) => (
                <Image
                  key={person.name}
                  src={unsplash(person.photo, 96)}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-ink object-cover"
                />
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 text-brand">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-1 text-sm text-muted">{t.hero.proof}</p>
            </div>
          </div>
        </div>

        {/* ---- Animated dashboard ---- */}
        <HeroVisual />
      </Container>
    </section>
  );
}
