"use client";

import Link from "next/link";
import { Container } from "@repo/ui";
import { CheckIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { SectionHeading } from "./SectionHeading";

const PLANS = [
  { id: "free", price: 0, href: "/signup" },
  { id: "pro", price: 29, href: "/subscribe?plan=pro", highlighted: true },
  { id: "team", price: 19, href: "/subscribe?plan=team", perSeat: true },
] as const;

export function Pricing() {
  const { t } = useI18n();

  return (
    <section id="pricing" className="py-24 lg:py-32">
      <Container>
        <SectionHeading eyebrow={t.pricing.eyebrow} title={t.pricing.title} subtitle={t.pricing.subtitle} center />

        <div className="mx-auto mt-16 grid max-w-6xl items-stretch gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const copy = t.pricing.plans[plan.id];
            const pro = "highlighted" in plan;
            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-[2rem] p-8 transition ${
                  pro
                    ? "bg-brand text-ink shadow-[0_30px_80px_-20px_rgba(255,221,45,0.45)] lg:-my-4 lg:py-12"
                    : "border border-white/[0.08] bg-surface hover:border-white/20"
                }`}
              >
                {pro && (
                  <span className="absolute right-6 top-6 rounded-full bg-ink px-3 py-1 text-[11px] font-bold text-brand">
                    {t.pricing.popular}
                  </span>
                )}

                <h3 className="font-heading text-2xl font-extrabold">{copy.name}</h3>
                <p className={`mt-2 text-sm ${pro ? "text-ink/70" : "text-muted"}`}>{copy.desc}</p>

                <p className="mt-8 flex items-baseline gap-1.5">
                  <span className="font-heading text-5xl font-extrabold tracking-tight">${plan.price}</span>
                  <span className={`text-sm ${pro ? "text-ink/60" : "text-muted"}`}>
                    {t.pricing.month}
                    {"perSeat" in plan && ` · ${t.pricing.seat}`}
                  </span>
                </p>

                <ul className="mt-8 flex-1 space-y-3.5">
                  {copy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                          pro ? "bg-ink text-brand" : "bg-brand/15 text-brand"
                        }`}
                      >
                        <CheckIcon className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className={pro ? "font-medium" : "text-white/80"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`mt-10 flex items-center justify-center rounded-full py-3.5 text-sm font-bold transition ${
                    pro
                      ? "bg-ink text-white hover:bg-ink/85"
                      : "border border-white/15 hover:border-brand hover:bg-brand hover:text-ink"
                  }`}
                >
                  {copy.cta}
                </Link>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
