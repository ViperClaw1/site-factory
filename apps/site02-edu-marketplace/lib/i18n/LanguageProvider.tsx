"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { dictionaries, type Dict } from "./dictionaries";
import { LANG_COOKIE, isLang, type Lang } from "./locales";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Dict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  hasSavedLang,
  children,
}: {
  initialLang: Lang;
  hasSavedLang: boolean;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Persist choice in a cookie so the server renders the right language on the next request.
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
  }, []);

  // First visit: pick the browser's preferred language if we support it.
  useEffect(() => {
    if (hasSavedLang) return;
    const preferred = navigator.languages
      .map((tag) => tag.slice(0, 2).toLowerCase())
      .find(isLang);
    if (preferred && preferred !== initialLang) setLang(preferred);
  }, [hasSavedLang, initialLang, setLang]);

  const value = useMemo(() => ({ lang, setLang, t: dictionaries[lang] }), [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
