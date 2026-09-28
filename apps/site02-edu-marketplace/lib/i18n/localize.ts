import type { ContentI18n } from "@repo/types";
import type { Lang } from "./locales";

// DB content (courses, modules, lessons) keeps its default text in the base
// columns and per-language overrides in an `i18n` jsonb column. Missing
// translation → falls back to the base column.
export function localize<T extends { i18n?: ContentI18n | null }, K extends keyof T & string>(
  row: T,
  field: K,
  lang: Lang,
): T[K] {
  return (row.i18n?.[lang]?.[field] as T[K] | undefined) ?? row[field];
}
