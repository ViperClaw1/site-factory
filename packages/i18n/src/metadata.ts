import type { Metadata, MetadataRoute } from "next";
import { LOCALES, type Lang } from "./locales";
import { withLocale } from "./routing";

// Canonical plus one hreflang per language and x-default. Paths are relative:
// metadataBase in the root layout makes them absolute.
export function alternates(path: string, lang: Lang): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = { "x-default": "/" };
  for (const locale of LOCALES) languages[locale.tag] = withLocale(path, locale.code);
  return { canonical: withLocale(path, lang), languages };
}

// `export const generateMetadata = localeMetadata("/cart")` for fixed paths.
export function localeMetadata(path: string, extra: Metadata = {}) {
  return ({ params }: { params: { locale: Lang } }): Metadata => ({
    ...extra,
    alternates: alternates(path, params.locale),
  });
}

// One entry per language, each listing all of its siblings.
export function sitemapEntries(
  base: string,
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {},
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = { "x-default": `${base}/` };
  for (const locale of LOCALES) languages[locale.tag] = base + withLocale(path, locale.code);
  return LOCALES.map((locale) => ({
    ...extra,
    url: base + withLocale(path, locale.code),
    alternates: { languages },
  }));
}

// Each language is its own entry in the ISR cache, so purge them all.
// Locale-free paths such as /admin collapse to a single entry.
export function localizedPaths(path: string): string[] {
  return [...new Set(LOCALES.map((locale) => withLocale(path, locale.code)))];
}
