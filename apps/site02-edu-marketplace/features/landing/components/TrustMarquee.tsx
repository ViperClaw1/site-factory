"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import { COMPANIES } from "../data";

export function TrustMarquee() {
  const { t } = useI18n();

  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015] py-10">
      <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/40">{t.trust.title}</p>
      {/* Track holds the list twice and slides by -50%, so the loop is seamless. */}
      <div className="mask-fade-x mt-7 overflow-hidden">
        <ul className="anim-marquee flex w-max">
          {[...COMPANIES, ...COMPANIES].map((name, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= COMPANIES.length}
              className="px-8 font-heading text-2xl font-extrabold tracking-tight text-white/30 transition hover:text-white/80 sm:px-10 sm:text-[1.75rem]"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
