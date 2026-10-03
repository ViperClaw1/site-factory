import { CATEGORIES, LEVELS } from "@/features/landing/data";
import { LOCALES, type Lang } from "@/lib/i18n/locales";

export { CATEGORIES, LEVELS, LOCALES };
export type { Lang };

export const BADGES = ["bestseller", "new", "popular"] as const;
export type CourseBadge = (typeof BADGES)[number];

export const CURRENCIES = ["USD", "EUR", "GBP", "RUB"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const COURSE_STATUSES = ["active", "draft", "archived"] as const;

/** Stable ids so the dropdown matches rows even before the instructors table is applied. */
export const INSTRUCTORS = [
  { id: "b1000000-0000-4000-8000-000000000001", name: "Alex Carter" },
  { id: "b1000000-0000-4000-8000-000000000002", name: "Dmitry Sokolov" },
  { id: "b1000000-0000-4000-8000-000000000003", name: "Priya Nair" },
  { id: "b1000000-0000-4000-8000-000000000004", name: "Lena Brandt" },
] as const;

export const COVER_BUCKET = "courses";
