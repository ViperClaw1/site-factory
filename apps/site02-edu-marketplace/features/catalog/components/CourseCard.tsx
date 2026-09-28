"use client";

import Link from "next/link";
import type { Course } from "@repo/types";
import { formatPrice } from "@repo/lib";
import { Card } from "@repo/ui";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { localize } from "@/lib/i18n/localize";

export function CourseCard({ course }: { course: Course }) {
  const { t, lang } = useI18n();
  const subtitle = localize(course, "subtitle", lang);

  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <Card className="flex h-full flex-col border border-white/10 bg-white/5 p-6 transition hover:border-[var(--color-primary)]/40">
        <p className="text-xs uppercase tracking-widest text-[var(--color-primary)]">
          {course.level ? t.catalog.levels[course.level] : course.category}
        </p>
        <h3 className="mt-3 font-heading text-2xl italic">{localize(course, "title", lang)}</h3>
        {subtitle && <p className="mt-2 text-sm text-[var(--color-text)]/70">{subtitle}</p>}
        <p className="mt-auto pt-6 text-sm font-medium">
          {formatPrice(course.price, course.currency, lang)}
          {course.duration_minutes != null ? ` · ${course.duration_minutes} ${t.catalog.minutes}` : null}
        </p>
      </Card>
    </Link>
  );
}
