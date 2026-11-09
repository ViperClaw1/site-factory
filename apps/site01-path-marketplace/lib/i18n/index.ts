"use client";

import { useLocale } from "@repo/i18n/client";
import { useCallback } from "react";
import { dictionaries, type MessageKey } from "./dictionaries";
import { localeTag } from "./locales";

export type { Dict, MessageKey } from "./dictionaries";
export { DEFAULT_LANG, LOCALES, isLang, localeTag, type Lang, type Locale } from "./locales";

// Translator hook, using the language from the address: `t(key, { name: value })`
// fills `{name}` placeholders, `price(amount, currency)` formats money for that
// language. (The shared @repo/lib formatPrice is pinned to ru-RU, which reads
// oddly on this site.)
export function useT() {
  const locale = useLocale();

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
