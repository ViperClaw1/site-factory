// Shared placeholder data for product/character cards and detail pages, so a
// card's title/icon and the page it links to (/p/placeholder-N,
// /characters/placeholder-N) always agree. Slugs are "placeholder-{index}" —
// pages parse the index back out to pick the same title deterministically.

const ICONS = [
  "fa-solid fa-gift",
  "fa-solid fa-box-open",
  "fa-solid fa-shirt",
  "fa-solid fa-palette",
  "fa-solid fa-dice-d20",
  "fa-solid fa-puzzle-piece",
  "fa-solid fa-star",
  "fa-solid fa-robot",
];

const PRODUCT_TITLES = [
  "Sample Collectible",
  "Mystery Figure",
  "Limited Print",
  "Art Toy Blind Box",
  "Prototype Vinyl",
  "Studio Sample",
  "Concept Piece",
  "Drop Preview",
];

const CHARACTER_NAMES = [
  "Mystery Character",
  "Unnamed Hero",
  "Character Reveal",
  "Coming Soon",
  "Secret Mascot",
  "New Face",
  "Studio Original",
  "Fan Favorite (TBA)",
];

export const PLACEHOLDER_PRODUCT_DESCRIPTION =
  "Full product details, gallery, and variants are coming soon. This is a placeholder page used to test the browse → cart → checkout flow before the catalog goes live.";

export const PLACEHOLDER_CHARACTER_DESCRIPTION = "This character's bio and gallery are coming soon.";

export function placeholderIcon(index: number): string {
  return ICONS[index % ICONS.length]!;
}

export function placeholderProductTitle(index: number): string {
  return PRODUCT_TITLES[index % PRODUCT_TITLES.length]!;
}

export function placeholderCharacterName(index: number): string {
  return CHARACTER_NAMES[index % CHARACTER_NAMES.length]!;
}

export function placeholderIndexFromSlug(slug: string): number {
  return Number(slug.replace("placeholder-", "")) || 0;
}

export function placeholderProductCardProps(index: number) {
  return {
    icon: placeholderIcon(index),
    href: `/p/placeholder-${index}`,
    title: placeholderProductTitle(index),
    description: "Details coming soon.",
  };
}

export function placeholderCharacterCardProps(index: number) {
  return {
    icon: "fa-solid fa-user",
    href: `/characters/placeholder-${index}`,
    title: placeholderCharacterName(index),
  };
}
