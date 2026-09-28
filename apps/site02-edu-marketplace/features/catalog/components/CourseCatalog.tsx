"use client";

import type { Course } from "@repo/types";
import { Container, Section } from "@repo/ui";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { CourseCard } from "./CourseCard";

// Client side so the headings follow the language switcher instantly.
export function CourseCatalog({ courses }: { courses: Course[] }) {
  const { t } = useI18n();

  return (
    <Section>
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">{t.catalog.eyebrow}</p>
        <h1 className="mt-4 font-heading text-4xl italic">{t.catalog.title}</h1>
        {courses.length === 0 ? (
          <p className="mt-8 text-[var(--color-text)]/60">{t.catalog.empty}</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
