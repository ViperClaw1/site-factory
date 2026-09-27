"use client";

import Image from "next/image";
import { Container } from "@repo/ui";
import { UsersIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { INSTRUCTORS, unsplash } from "../data";
import { SectionHeading } from "./SectionHeading";

export function Instructors() {
  const { t, lang } = useI18n();
  const numberFormat = new Intl.NumberFormat(lang);

  return (
    <section id="instructors" className="border-y border-white/[0.06] bg-white/[0.015] py-24 lg:py-32">
      <Container>
        <SectionHeading eyebrow={t.instructors.eyebrow} title={t.instructors.title} subtitle={t.instructors.subtitle} />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INSTRUCTORS.map((person, i) => (
            <article
              key={person.name}
              className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-surface transition hover:border-brand/40"
            >
              <div className="relative aspect-[4/4.2] overflow-hidden">
                <Image
                  src={unsplash(person.photo, 600)}
                  alt={person.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                  {person.company}
                </span>
              </div>
              <div className="p-5 pt-1">
                <h3 className="font-heading text-lg font-bold">{person.name}</h3>
                <p className="mt-1 text-sm text-muted">
                  {t.instructors.roles[i]} · <span className="text-white/80">{person.company}</span>
                </p>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-white/60">
                  <UsersIcon className="h-3.5 w-3.5 text-brand" />
                  {numberFormat.format(person.students)} {t.instructors.students}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
