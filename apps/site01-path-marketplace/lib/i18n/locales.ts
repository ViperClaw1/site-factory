export const LOCALES = [
  { code: "en", label: "EN", native: "English" },
  { code: "de", label: "DE", native: "Deutsch" },
  { code: "fr", label: "FR", native: "Français" },
  { code: "es", label: "ES", native: "Español" },
  { code: "pt", label: "PT", native: "Português" },
  { code: "id", label: "ID", native: "Bahasa Indonesia" },
  { code: "ar", label: "AR", native: "العربية" },
  { code: "zh", label: "ZH", native: "中文" },
  { code: "ja", label: "JA", native: "日本語" },
  { code: "th", label: "TH", native: "ไทย" },
  { code: "vi", label: "VI", native: "Tiếng Việt" },
  { code: "ko", label: "KO", native: "한국어" },
  { code: "it", label: "IT", native: "Italiano" },
  { code: "sw", label: "SW", native: "Kiswahili" },
  { code: "ha", label: "HA", native: "Hausa" },
  { code: "am", label: "AM", native: "አማርኛ" },
] as const;

export type Lang = (typeof LOCALES)[number]["code"];

/** @deprecated Use `Lang`. Kept so existing site01 imports keep compiling. */
export type Locale = Lang;

export const DEFAULT_LANG: Lang = "en";

// BCP 47 tags for <html lang> and Intl number formatting.
// Japanese is ja-JP: "ja-SP" is not a valid region tag.
const LOCALE_TAGS: Record<Lang, string> = {
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

export function localeTag(lang: Lang): string {
  return LOCALE_TAGS[lang];
}

export function isLang(value: unknown): value is Lang {
  return LOCALES.some((locale) => locale.code === value);
}
