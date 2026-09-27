export const LOCALES = [
  { code: "en", label: "EN", native: "English" },
  { code: "ru", label: "RU", native: "Русский" },
  { code: "de", label: "DE", native: "Deutsch" },
  { code: "fr", label: "FR", native: "Français" },
  { code: "es", label: "ES", native: "Español" },
  { code: "it", label: "IT", native: "Italiano" },
  { code: "zh", label: "中文", native: "中文" },
  { code: "ja", label: "日本語", native: "日本語" },
] as const;

export type Lang = (typeof LOCALES)[number]["code"];

export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "lang";

export function isLang(value: unknown): value is Lang {
  return LOCALES.some((locale) => locale.code === value);
}
