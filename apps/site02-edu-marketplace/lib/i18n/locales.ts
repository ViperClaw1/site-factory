// Switcher order: registry in 03-strany/_yazyki-i-strany.md (high, then medium, then low).
// Russian sits after Italian. Hindi and Turkish are outside the sixteen.
export const LOCALES = [
  { code: "en", label: "EN", native: "English" },
  { code: "es", label: "ES", native: "Español" },
  { code: "pt", label: "PT", native: "Português" },
  { code: "de", label: "DE", native: "Deutsch" },
  { code: "fr", label: "FR", native: "Français" },
  { code: "it", label: "IT", native: "Italiano" },
  { code: "ru", label: "RU", native: "Русский" },
  { code: "ja", label: "JA", native: "日本語" },
  { code: "ko", label: "KO", native: "한국어" },
  { code: "zh", label: "ZH", native: "中文" },
  { code: "id", label: "ID", native: "Bahasa Indonesia" },
  { code: "vi", label: "VI", native: "Tiếng Việt" },
  { code: "th", label: "TH", native: "ไทย" },
  { code: "ar", label: "AR", native: "العربية" },
  { code: "sw", label: "SW", native: "Kiswahili" },
  { code: "ha", label: "HA", native: "Hausa" },
  { code: "am", label: "AM", native: "አማርኛ" },
  { code: "hi", label: "HI", native: "हिन्दी" },
  { code: "tr", label: "TR", native: "Türkçe" },
] as const;

export type Lang = (typeof LOCALES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

// BCP 47 tags for <html lang>. Japanese is ja-JP: "ja-SP" is not a valid region tag.
const LOCALE_TAGS: Record<Lang, string> = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-PT",
  de: "de-DE",
  fr: "fr-FR",
  it: "it-IT",
  ru: "ru-RU",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  id: "id-ID",
  vi: "vi-VN",
  th: "th-TH",
  ar: "ar",
  sw: "sw",
  ha: "ha",
  am: "am",
  hi: "hi-IN",
  tr: "tr-TR",
};

export function localeTag(lang: Lang): string {
  return LOCALE_TAGS[lang];
}

export function isLang(value: unknown): value is Lang {
  return LOCALES.some((locale) => locale.code === value);
}
