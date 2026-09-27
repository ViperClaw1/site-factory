"use client";

import { Container } from "@repo/ui";
import { BriefcaseIcon, CodeIcon, CompassIcon, ReviewIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { SectionHeading } from "./SectionHeading";

// Icon per step, index-aligned with t.how.steps.
const stepIcons = [CompassIcon, CodeIcon, ReviewIcon, BriefcaseIcon];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how" className="py-24 lg:py-32">
      <Container>
        <SectionHeading eyebrow={t.how.eyebrow} title={t.how.title} center />

        <ol className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.how.steps.map((step, i) => {
            const Icon = stepIcons[i] ?? CompassIcon;
            return (
              <li
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-surface p-7 transition hover:border-brand/40"
              >
                <span className="absolute -right-2 -top-6 font-heading text-[7rem] font-extrabold leading-none text-white/[0.04] transition group-hover:text-brand/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-ink">
                  <Icon className="h-6 w-6" />
                </span>
                <p className="relative mt-8 text-xs font-bold text-brand">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="relative mt-2 font-heading text-xl font-bold">{step.title}</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
