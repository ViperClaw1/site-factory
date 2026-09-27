"use client";

import Image from "next/image";
import { Container } from "@repo/ui";
import { StarIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { TESTIMONIALS, unsplash } from "../data";
import { SectionHeading } from "./SectionHeading";

export function Testimonials() {
  const { t } = useI18n();

  return (
    <section id="reviews" className="py-24 lg:py-32">
      <Container>
        <SectionHeading eyebrow={t.reviews.eyebrow} title={t.reviews.title} center />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((person, i) => {
            const review = t.reviews.items[i];
            if (!review) return null;
            return (
              <figure
                key={person.name}
                className="flex flex-col rounded-3xl border border-white/[0.08] bg-surface p-7 transition hover:border-brand/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5 text-brand" aria-label="5/5">
                    {Array.from({ length: 5 }, (_, s) => (
                      <StarIcon key={s} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand">
                    {t.courses.items[person.course].title}
                  </span>
                </div>

                <blockquote className="mt-6 flex-1 text-base leading-relaxed text-white/85">
                  <span className="font-heading text-3xl leading-none text-brand">“</span>
                  {review.quote}
                </blockquote>

                <figcaption className="mt-8 flex items-center gap-3 border-t border-white/[0.06] pt-6">
                  <Image
                    src={unsplash(person.photo, 112)}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-heading font-bold">{person.name}</p>
                    <p className="text-sm text-muted">{review.role}</p>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
