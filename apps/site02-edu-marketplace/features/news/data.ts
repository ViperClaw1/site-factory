import { unsplash } from "@/features/landing/data";
import type { Dict } from "@/lib/i18n/dictionaries";

// Language-independent feed content; copy for each slug lives in the i18n dictionaries.

export type NewsTopic = Exclude<keyof Dict["news"]["topics"], "all">;
export type NewsSlug = keyof Dict["news"]["stories"];

export const NEWS_FILTERS = ["all", "product", "careers", "community"] as const satisfies readonly (
  | "all"
  | NewsTopic
)[];

export const NEWS: { slug: NewsSlug; topic: NewsTopic; photo: string }[] = [
  { slug: "workspace", topic: "product", photo: unsplash("1517694712202-14dd9538aa97", 1200) },
  { slug: "hiring", topic: "careers", photo: unsplash("1522071820081-009f0129c71c", 900) },
  { slug: "mina", topic: "community", photo: unsplash("1551288049-bebda4e38f71", 900) },
];
