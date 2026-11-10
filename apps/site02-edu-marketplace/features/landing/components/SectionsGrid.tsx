"use client";

import { Link } from "@repo/i18n/client";
import type { Course } from "@repo/types";
import { Container } from "@repo/ui";
import { ArrowRightIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { SECTIONS, isSectionId, type SectionId } from "../data";
import { SECTION_ICONS } from "../sectionIcons";
import { SectionHeading } from "./SectionHeading";

// Home page grid of education-level sections; each card opens /courses/s/[section].
export function SectionsGrid({ courses }: { courses: Course[] }) {
  const { t, lang } = useI18n();
  const numberFormat = new Intl.NumberFormat(lang);

  /* ---- Course count per section, from the list the page already loaded ---- */
  const counts = courses.reduce<Partial<Record<SectionId, number>>>((acc, course) => {
    const key = isSectionId(course.section) ? course.section : "additional";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section id="sections" className="py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow={t.courses.sectionsBlock.eyebrow}
          title={t.courses.sectionsBlock.title}
          subtitle={t.courses.sectionsBlock.subtitle}
        />

        {/* ---- Section cards ---- */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((section, index) => {
            const Icon = SECTION_ICONS[section];
            return (
              <Link
                key={section}
                href={`/courses/s/${section}`}
                style={{ animationDelay: `${index * 60}ms` }}
                className="anim-fade-up group flex flex-col rounded-3xl border border-white/[0.08] bg-surface p-6 transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_60px_-24px_rgba(255,221,45,0.25)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-ink">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold leading-snug">{t.courses.sections[section]}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t.courses.sectionBlurbs[section]}</p>
                <span className="mt-5 flex items-center justify-between text-xs font-semibold text-white/70">
                  {numberFormat.format(counts[section] ?? 0)} {t.courses.sectionsBlock.count}
                  <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1 group-hover:text-brand rtl:rotate-180" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
