import type { MetadataRoute } from "next";
import { getCharacters, getCollections } from "@/lib/api-client";

// Fixed taxonomy matching CATEGORY_OPTIONS in app/(catalog)/shop/page.tsx —
// kept in sync manually since Supabase doesn't expose a categories table.
const CATEGORIES = ["toys", "collectible_toys", "books", "artbooks", "designs", "merch", "figures"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.BASE_URL;
  if (!base) {
    throw new Error("BASE_URL is not set");
  }

  const [collections, characters] = await Promise.all([getCollections(), getCharacters()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/collections`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/characters`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: `${base}/shop/${category}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = collections.map((collection) => ({
    url: `${base}/collections/${collection.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const characterRoutes: MetadataRoute.Sitemap = characters.map((character) => ({
    url: `${base}/characters/${character.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...characterRoutes];
}
