// Same rules as scripts/seed-showcase-catalog.mjs so admin slugs match seeded ones.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function productSlug(title: string, character?: string): string {
  const source = character?.trim() ? `${character.trim()} ${title.trim()}` : title.trim();
  return slugify(source);
}
