"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";

// Placeholder until wishlists are wired up (site01 has a `wishlists` table to copy).
export default function FavoritesPage() {
  const { t } = useI18n();
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{t.nav.favorites}</h1>
      <p className="mt-4 text-white/60">{t.account.favoritesEmpty}</p>
    </section>
  );
}
