"use client";

import { createContext, useContext, useMemo } from "react";
import { dictionaries, type Dict } from "./dictionaries";
import type { Lang } from "./locales";

interface I18nContextValue {
  lang: Lang;
  t: Dict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// The language comes from the [locale] route param; switching it is a navigation.
export function LanguageProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  const value = useMemo(() => ({ lang, t: dictionaries[lang] }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
