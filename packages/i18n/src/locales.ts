// Language registry shared by every site. Order is the switcher order from the
// ecosystem rules (section 04). `code` is the URL segment, `tag` is the value
// for <html lang> and hreflang: language only, except pt-BR and zh-CN.
// Spanish has no region yet because the rules leave its variant undecided.
export const LOCALES = [
  { code: "en", label: "EN", native: "English", tag: "en" },
  { code: "de", label: "DE", native: "Deutsch", tag: "de" },
  { code: "fr", label: "FR", native: "Français", tag: "fr" },
  { code: "es", label: "ES", native: "Español", tag: "es" },
  { code: "pt", label: "PT", native: "Português", tag: "pt-BR" },
  { code: "it", label: "IT", native: "Italiano", tag: "it" },
  { code: "tr", label: "TR", native: "Türkçe", tag: "tr" },
  { code: "ru", label: "RU", native: "Русский", tag: "ru" },
  { code: "zh", label: "ZH", native: "中文", tag: "zh-CN" },
  { code: "ja", label: "JA", native: "日本語", tag: "ja" },
  { code: "ko", label: "KO", native: "한국어", tag: "ko" },
  { code: "ar", label: "AR", native: "العربية", tag: "ar" },
  { code: "id", label: "ID", native: "Bahasa Indonesia", tag: "id" },
  { code: "hi", label: "HI", native: "हिन्दी", tag: "hi" },
  { code: "vi", label: "VI", native: "Tiếng Việt", tag: "vi" },
  { code: "th", label: "TH", native: "ไทย", tag: "th" },
  { code: "sw", label: "SW", native: "Kiswahili", tag: "sw" },
  { code: "ha", label: "HA", native: "Hausa", tag: "ha" },
  { code: "am", label: "AM", native: "አማርኛ", tag: "am" },
] as const;

export type Lang = (typeof LOCALES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";

// Only consulted when choosing a language for an address without a prefix.
export const LANG_COOKIE = "lang";

export function isLang(value: unknown): value is Lang {
  return LOCALES.some((locale) => locale.code === value);
}

export function localeTag(lang: Lang): string {
  return LOCALES.find((locale) => locale.code === lang)!.tag;
}

export function isRtl(lang: Lang): boolean {
  return lang === "ar";
}
