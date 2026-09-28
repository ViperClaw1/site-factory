"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";

// Placeholder for paid plans (Pricing → Pro / Team). Subscriptions are phase E6;
// ?plan=pro|team is passed along already so the real page can preselect it.
export default function SubscribePage() {
  const { t } = useI18n();
  const s = t.subscribe;

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-24 text-center sm:py-32">
      <p className="text-xs uppercase tracking-[0.2em] text-brand">{s.eyebrow}</p>
      <h1 className="mt-4 font-heading text-4xl font-extrabold sm:text-5xl">{s.title}</h1>
      <p className="mx-auto mt-4 max-w-md text-white/60">{s.text}</p>
      <Link
        href="/courses"
        className="mt-8 inline-flex h-12 items-center rounded-full bg-brand px-6 text-sm font-bold text-ink transition hover:bg-brand-dark"
      >
        {s.browse}
      </Link>
    </section>
  );
}
