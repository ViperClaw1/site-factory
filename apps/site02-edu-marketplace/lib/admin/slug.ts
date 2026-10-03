export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function courseSlug(title: string): string {
  return slugify(title.trim());
}
