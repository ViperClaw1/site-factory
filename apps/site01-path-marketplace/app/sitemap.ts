import type { MetadataRoute } from "next";
import { getCharacters, getCollections } from "@/lib/api-client";
import { sitemapEntries } from "@repo/i18n";

// Otherwise built once at build time and frozen until the next deploy.
export const revalidate = 3600;

// Fixed taxonomy matching CATEGORY_OPTIONS in app/(catalog)/shop/page.tsx —
// kept in sync manually since Supabase doesn't expose a categories table.
const CATEGORIES = ["toys", "collectible_toys", "books", "artbooks", "designs", "merch", "figures"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Demo: advertise nothing. Delete this return when the site is public.
  return [];

  // The early return above makes this unreachable, so a plain `if (!base) throw`
  // does not narrow the env var. `?? never` keeps the guard and types `base` as string.
  const base =
    process.env.BASE_URL ??
    (() => {
      throw new Error("BASE_URL is not set");
    })();

  const [collections, characters] = await Promise.all([getCollections(), getCharacters()]);

  const entries: [path: string, options: { changeFrequency: "daily" | "weekly"; priority: number }][] = [
    ["/", { changeFrequency: "daily", priority: 1 }],
    ["/shop", { changeFrequency: "daily", priority: 0.9 }],
    ["/collections", { changeFrequency: "weekly", priority: 0.7 }],
    ["/characters", { changeFrequency: "weekly", priority: 0.7 }],
    ...CATEGORIES.map((category) => [`/shop/${category}`, { changeFrequency: "daily", priority: 0.8 }] as [string, { changeFrequency: "daily"; priority: number }]),
    ...collections.map((collection) => [`/collections/${collection.slug}`, { changeFrequency: "weekly", priority: 0.6 }] as [string, { changeFrequency: "weekly"; priority: number }]),
    ...characters.map((character) => [`/characters/${character.slug}`, { changeFrequency: "weekly", priority: 0.6 }] as [string, { changeFrequency: "weekly"; priority: number }]),
  ];

  return entries.flatMap(([path, options]) => sitemapEntries(base, path, options));
}
