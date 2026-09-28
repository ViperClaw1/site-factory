"use client";

import type { CourseWithCurriculum } from "@repo/types";
import { formatPrice } from "@repo/lib";
import { Button, Container, Section } from "@repo/ui";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { localize } from "@/lib/i18n/localize";

// Course page body. Client side so both UI labels and DB content (via the
// `i18n` column) follow the language switcher.
export function CourseDetail({ course }: { course: CourseWithCurriculum }) {
  const { t, lang } = useI18n();
  const c = t.catalog;
  const subtitle = localize(course, "subtitle", lang);

  return (
    <Section>
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {course.level ? c.levels[course.level] : course.category}
        </p>
        <h1 className="mt-4 font-heading text-5xl italic">{localize(course, "title", lang)}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-[var(--color-text)]/70">{subtitle}</p>}
        <p className="mt-6 text-xl">{formatPrice(course.price, course.currency, lang)}</p>
        {/* Cart lands in E3 — see specs/site02-E3-payment-flow-plan.md. */}
        <Button disabled className="mt-6">
          {c.addToCart} · {c.soon}
        </Button>

        {/* ---- Curriculum ---- */}
        <h2 className="mt-16 text-xs uppercase tracking-[0.2em] text-white/50">{c.program}</h2>
        <ol className="mt-6 space-y-8">
          {course.modules.map((module, index) => (
            <li key={module.id}>
              <h3 className="font-heading text-2xl italic">
                {String(index + 1).padStart(2, "0")}. {localize(module, "title", lang)}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]/70">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    {localize(lesson, "title", lang)}
                    <span className="ml-2 uppercase tracking-wide text-[var(--color-primary)]">
                      {c.lessonTypes[lesson.type]}
                      {lesson.is_preview ? ` · ${c.preview}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
