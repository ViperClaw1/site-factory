"use client";

import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { dictionaries, type MessageKey } from "./dictionaries";
import { DEFAULT_LANG, isLang, localeTag, type Lang } from "./locales";

export type { Dict, MessageKey } from "./dictionaries";
export { DEFAULT_LANG, LOCALES, isLang, localeTag, type Lang, type Locale } from "./locales";

interface LocaleState {
  locale: Lang;
  setLocale: (locale: Lang) => void;
}

// Client-only locale, persisted to localStorage. Same skipHydration pattern as
// the cart store (lib/cart.ts): server and first client render are always
// English so SSR output matches, then <NavBar> rehydrates once on mount and
// every subscribed component re-renders in the saved language.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LANG,
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "toyverse-locale",
      skipHydration: true,
      // Ignore a saved locale that's no longer offered (e.g. "ru") instead of
      // indexing dictionaries with it.
      merge: (persisted, current) => {
        const locale = (persisted as Partial<LocaleState> | undefined)?.locale;
        return isLang(locale) ? { ...current, locale } : current;
      },
    }
  )
);

// Translator hook: `t(key, { name: value })` fills `{name}` placeholders,
// `price(amount, currency)` formats money for the active locale. (The shared
// @repo/lib formatPrice is pinned to ru-RU, which reads oddly on this site.)
export function useT() {
  const locale = useLocaleStore((state) => state.locale);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const template = dictionaries[locale][key] ?? dictionaries.en[key];
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match
      );
    },
    [locale]
  );

  const price = useCallback(
    (amount: number, currency: string) =>
      new Intl.NumberFormat(localeTag(locale), {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [locale]
  );

  return { t, price, locale };
}
