"use client";

import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MESSAGES, type MessageKey } from "./messages";

export type { MessageKey } from "./messages";

// Display order of the nav dropdown / footer bar. English stays the default
// (server render + first client render) regardless of position here.
export const LOCALES = ["ru", "en", "de", "fr", "es", "it", "zh", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

// Short labels used by the nav dropdown and the footer language bar.
export const LOCALE_LABELS: Record<Locale, string> = {
  ru: "RU",
  en: "EN",
  de: "DE",
  fr: "FR",
  es: "ES",
  it: "IT",
  zh: "中文",
  ja: "JP",
};

// BCP 47 tags for <html lang> and Intl number formatting.
const LOCALE_TAGS: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  zh: "zh-CN",
  ja: "ja-JP",
};

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

// Client-only locale, persisted to localStorage. Same skipHydration pattern as
// the cart store (lib/cart.ts): server and first client render are always
// English so SSR output matches, then <NavBar> rehydrates once on mount and
// every subscribed component re-renders in the saved language.
export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: "toyverse-locale",
      skipHydration: true,
      // Ignore a saved locale that's no longer offered (e.g. "ko" from before
      // the locale set changed) instead of indexing MESSAGES with it.
      merge: (persisted, current) => {
        const locale = (persisted as Partial<LocaleState> | undefined)?.locale;
        return isLocale(locale) ? { ...current, locale } : current;
      },
    }
  )
);

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale];
}

// Translator hook: `t(key, { name: value })` fills `{name}` placeholders,
// `price(amount, currency)` formats money for the active locale. (The shared
// @repo/lib formatPrice is pinned to ru-RU, which reads oddly on this site.)
export function useT() {
  const locale = useLocaleStore((state) => state.locale);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const template = MESSAGES[locale][key] ?? MESSAGES.en[key];
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match
      );
    },
    [locale]
  );

  const price = useCallback(
    (amount: number, currency: string) =>
      new Intl.NumberFormat(LOCALE_TAGS[locale], {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [locale]
  );

  return { t, price, locale };
}
