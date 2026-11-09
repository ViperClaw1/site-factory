import type { Lang } from "@repo/i18n";

// The registry is shared by all sites and lives in packages/i18n.
export { DEFAULT_LANG, LOCALES, isLang, localeTag, type Lang } from "@repo/i18n";

/** @deprecated Use `Lang`. Kept so existing site01 imports keep compiling. */
export type Locale = Lang;
