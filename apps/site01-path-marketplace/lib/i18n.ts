"use client";

import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MESSAGES, type MessageKey } from "./messages";

export type { MessageKey } from "./messages";

// Display order of the nav dropdown / footer bar. English stays the default
// (server render + first client render) regardless of position here.
export const LOCALES = [
  "en",
  "de",
  "fr",
  "es",
  "pt",
  "id",
  "ar",
  "zh",
  "ja",
  "th",
  "vi",
  "ko",
  "it",
  "sw",
  "ha",
  "am",
] as const;
export type Locale = (typeof LOCALES)[number];

// Short labels used by the nav dropdown and the footer language bar.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  fr: "FR",
  es: "ES",
  pt: "PT",
  id: "ID",
  ar: "AR",
  zh: "ZH",
  ja: "JA",
  th: "TH",
  vi: "VI",
  ko: "KO",
  it: "IT",
  sw: "SW",
  ha: "HA",
  am: "AM",
};

// Native name + short code for the header language menu.
export const LOCALE_OPTIONS: Record<Locale, { name: string; code: string }> = {
  en: { name: "English", code: "EN" },
  de: { name: "Deutsch", code: "DE" },
  fr: { name: "Français", code: "FR" },
  es: { name: "Español", code: "ES" },
  pt: { name: "Português", code: "PT" },
  id: { name: "Bahasa Indonesia", code: "ID" },
  ar: { name: "العربية", code: "AR" },
  zh: { name: "中文", code: "ZH" },
  ja: { name: "日本語", code: "JA" },
  th: { name: "ไทย", code: "TH" },
  vi: { name: "Tiếng Việt", code: "VI" },
  ko: { name: "한국어", code: "KO" },
  it: { name: "Italiano", code: "IT" },
  sw: { name: "Kiswahili", code: "SW" },
  ha: { name: "Hausa", code: "HA" },
  am: { name: "አማርኛ", code: "AM" },
};

// BCP 47 tags for <html lang> and Intl number formatting.
// Japanese is ja-JP: "ja-SP" is not a valid region tag.
const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  id: "id-ID",
  ar: "ar",
  zh: "zh-CN",
  ja: "ja-JP",
  th: "th-TH",
  vi: "vi-VN",
  ko: "ko-KR",
  it: "it-IT",
  sw: "sw",
  ha: "ha",
  am: "am",
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
      // Ignore a saved locale that's no longer offered (e.g. "ru" from before
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
