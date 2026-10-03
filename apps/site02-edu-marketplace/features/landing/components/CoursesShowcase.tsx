"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Course } from "@repo/types";
import { Container } from "@repo/ui";
import { ArrowRightIcon, ClockIcon, UsersIcon } from "@/components/icons";
import { coverImageProps } from "@/lib/image-variants";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { localize } from "@/lib/i18n/localize";
import { CATEGORIES, LEVELS, type BadgeId, type CategoryId } from "../data";
import { SectionHeading } from "./SectionHeading";

const badgeStyle: Record<BadgeId, string> = {
  bestseller: "bg-brand text-ink",
  new: "bg-emerald-400 text-ink",
  popular: "bg-white text-ink",
};

// Courses come from Supabase (getCourses), already sorted by the caller.
export function CoursesShowcase({ courses }: { courses: Course[] }) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const visible = filter === "all" ? courses : courses.filter((course) => course.category === filter);
  const numberFormat = new Intl.NumberFormat(lang);

  return (
    <section id="courses" className="py-24 lg:py-32">
      <Container>
        <SectionHeading eyebrow={t.courses.eyebrow} title={t.courses.title} subtitle={t.courses.subtitle} />

        {/* ---- Category filter pills ---- */}
        <div className="-mx-4 mt-10 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {(["all", ...CATEGORIES] as const).map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(cat)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-brand text-ink"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {t.courses.cats[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---- Course cards (keyed by filter so they re-animate on change) ---- */}
        <div key={filter} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((course, index) => {
            const title = localize(course, "title", lang);
            const categoryLabel = t.courses.cats[course.category as CategoryId] ?? course.category;
            const levelIndex = course.level ? LEVELS.indexOf(course.level) : -1;
            return (
              <article
                key={course.id}
                style={{ animationDelay: `${index * 60}ms` }}
                className="anim-fade-up group flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-surface transition duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_24px_60px_-24px_rgba(255,221,45,0.25)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {course.cover_image && (
                    <Image
                      src={course.cover_image}
                      alt={title}
                      {...coverImageProps(course)}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {course.badge && (
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeStyle[course.badge]}`}>
                        {t.courses.badges[course.badge]}
                      </span>
                    )}
                    {categoryLabel && (
                      <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-heading text-lg font-bold leading-snug">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{localize(course, "description", lang)}</p>

                  {/* Level indicator: 3 bars, filled up to the course level */}
                  {course.level && (
                    <div className="mt-5 flex items-center gap-2 text-xs text-white/70">
                      <span className="flex items-end gap-[3px]" aria-hidden>
                        {LEVELS.map((level, i) => (
                          <span
                            key={level}
                            className={`w-1 rounded-sm ${i <= levelIndex ? "bg-brand" : "bg-white/15"}`}
                            style={{ height: `${6 + i * 4}px` }}
                          />
                        ))}
                      </span>
                      {t.courses.levels[course.level]}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {numberFormat.format(course.students ?? 0)} {t.courses.students}
                    </span>
                    {course.duration_months != null && (
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {course.duration_months} {t.courses.months}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/course/${course.slug}`}
                    className="mt-6 flex items-center justify-between rounded-2xl bg-white/[0.05] px-4 py-3 text-sm font-bold transition group-hover:bg-brand group-hover:text-ink"
                  >
                    {t.courses.enroll}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        {visible.length === 0 && <p className="mt-10 text-muted">{t.catalog.empty}</p>}
      </Container>
    </section>
  );
}
