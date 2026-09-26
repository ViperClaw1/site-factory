// Showcase catalog used while the real one (Supabase/Directus) is empty, so
// the storefront renders fully and every card links somewhere real to
// exercise browse → cart → checkout. Slugs are "placeholder-{index}" — detail
// pages parse the index back out to pick the same item deterministically.

import type { Character } from "@repo/types";
import { unsplash, type CardItem } from "./catalog";

// Catalog rows: [title, subtitle, character, price, unsplash photo id, badge, category, soldOut?]
type ShowcaseRow = [string, string, string, number, string, CardItem["badge"], string, boolean?];

const ROWS: ShowcaseRow[] = [
  ["Fantasia Blind Box", "Vol.8", "Molly", 16.99, "1615531880394-84fde621fcfc", "hot", "collectible_toys"],
  ["The Monsters S3", "Designer Figure", "Labubu", 24.99, "1781196208914-24e9fc9276aa", "new", "figures"],
  ["Dark Side Constructor", "Build Series Vol.2", "Skullpanda", 59.99, "1668119065964-8e78fddc5dfe", "limited", "toys"],
  ["Art Universe Pack", "Digital Prints", "Crybaby", 9.99, "1579958746164-e0adaf13ae50", "digital", "designs"],
  ["Aquarium World 400%", "Mega Figure", "Dimoo", 89.99, "1779792495496-a26f748f57b0", "hot", "figures"],
  ["Little Mermaid Vol.3", "Blind Box", "Hirono", 18.99, "1615531880011-8c776c07a818", null, "collectible_toys"],
  ["Space Travel Comic", "Graphic Novel Vol.1", "Dimoo", 19.99, "1634828221818-503587f33d02", "new", "books"],
  ["× Picasso Figure", "Collab Edition", "Molly", 39.99, "1630549316063-7ae02749d2cc", null, "figures", true],
  ["Bear Plush Duo", "Plush Collection", "Crybaby", 12.99, "1622473541183-ddae2b015b9d", null, "toys"],
  ["Vol.3 Art Compendium", "Art Book", "Labubu", 34.99, "1628426912206-d88e22da5c76", "new", "artbooks"],
  ["Chaos Friends Trio", "Collector Set", "Labubu", 54.99, "1613792720457-4944d7156999", null, "collectible_toys"],
  ["Fantasy Clowns Vol.1", "Blind Box", "Hirono", 16.99, "1775410632946-26f19376617e", "limited", "collectible_toys"],
];

export const SHOWCASE_ITEMS: CardItem[] = ROWS.map(
  ([title, subtitle, character, price, photo, badge, category, soldOut], index) => ({
    id: `placeholder-${index}`,
    slug: `placeholder-${index}`,
    title,
    subtitle,
    character,
    characterKey: character.toLowerCase(),
    price,
    currency: "USD",
    image: unsplash(photo),
    imageAlt: `${character} — ${title}`,
    badge,
    soldOut: soldOut ?? false,
    category,
  })
);

// Same subset/order as the reference design's "New Arrivals" strip.
export const SHOWCASE_NEW_ARRIVALS = [1, 2, 3, 6, 9, 11].map((i) => SHOWCASE_ITEMS[i]!);

// The flash-sale product: Aquarium World at 40% off. Its own productId keeps
// the discounted line separate from a full-price one in the cart.
export const SHOWCASE_FLASH_SALE: CardItem = {
  ...SHOWCASE_ITEMS[4]!,
  id: "placeholder-4-flash",
  price: 53.99,
  compareAt: 89.99,
};

// Character IPs — order defines the character placeholder slugs.
const CHARACTER_NAMES = ["Molly", "Labubu", "Hirono", "Dimoo", "Crybaby", "Skullpanda"];

export const PLACEHOLDER_PRODUCT_DESCRIPTION =
  "Full product details, gallery, and variants are coming soon. This is a placeholder page used to test the browse → cart → checkout flow before the catalog goes live.";

export const PLACEHOLDER_CHARACTER_DESCRIPTION = "This character's bio and gallery are coming soon.";

export function placeholderIndexFromSlug(slug: string): number {
  return Number(slug.replace("placeholder-", "")) || 0;
}

export function placeholderProduct(index: number): CardItem {
  return SHOWCASE_ITEMS[index % SHOWCASE_ITEMS.length]!;
}

export function placeholderCharacterName(index: number): string {
  return CHARACTER_NAMES[index % CHARACTER_NAMES.length]!;
}

// Placeholder characters as real Character records, with the first showcase
// product of each IP as their avatar.
export function placeholderCharacters(): Character[] {
  return CHARACTER_NAMES.map((name, index) => ({
    id: `placeholder-${index}`,
    slug: `placeholder-${index}`,
    name,
    description: PLACEHOLDER_CHARACTER_DESCRIPTION,
    image: SHOWCASE_ITEMS.find((item) => item.character === name)?.image ?? null,
    status: "published",
  }));
}

export function placeholderCharacter(index: number): Character {
  return placeholderCharacters()[index % CHARACTER_NAMES.length]!;
}

export function showcaseItemsForCharacter(name: string): CardItem[] {
  return SHOWCASE_ITEMS.filter((item) => item.character === name);
}
