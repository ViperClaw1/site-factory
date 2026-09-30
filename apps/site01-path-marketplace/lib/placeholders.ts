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

// Fresh-sale rotation. Each row is an existing showcase product at a fixed
// discount, plus a countdown length that wraps (there is no real end date yet).
// The home section advances one deal per local day at FRESH_SALE_SWITCH_HOUR.
type FreshSaleRow = { index: number; price: number; countdownSeconds: number };

const FRESH_SALE_ROWS: FreshSaleRow[] = [
  { index: 4, price: 53.99, countdownSeconds: 6 * 3600 + 23 * 60 + 7 },
  { index: 2, price: 41.99, countdownSeconds: 11 * 3600 + 4 * 60 + 18 },
  { index: 10, price: 38.49, countdownSeconds: 3 * 3600 + 47 * 60 + 55 },
  { index: 7, price: 27.99, countdownSeconds: 18 * 3600 + 12 * 60 + 33 },
  { index: 1, price: 17.49, countdownSeconds: 8 * 3600 + 56 * 60 + 2 },
];

export interface FreshSaleDeal {
  item: CardItem;
  countdownSeconds: number;
}

/** Local hour when the featured deal advances to the next one. */
export const FRESH_SALE_SWITCH_HOUR = 18;

export const FRESH_SALE_DEALS: FreshSaleDeal[] = FRESH_SALE_ROWS.map(({ index, price, countdownSeconds }) => {
  const source = SHOWCASE_ITEMS[index]!;
  return {
    countdownSeconds,
    item: {
      ...source,
      id: `${source.id}-fresh`,
      price,
      compareAt: source.price,
    },
  };
});

/** Deal index for the local calendar day that started at `switchHour`. */
export function freshSaleIndex(now: Date, count: number, switchHour = FRESH_SALE_SWITCH_HOUR): number {
  if (count <= 0) return 0;
  const slot = new Date(now);
  slot.setHours(switchHour, 0, 0, 0);
  if (now.getTime() < slot.getTime()) slot.setDate(slot.getDate() - 1);
  const day = Math.floor(Date.UTC(slot.getFullYear(), slot.getMonth(), slot.getDate()) / 86_400_000);
  return ((day % count) + count) % count;
}

/** Seconds left in a looping countdown of `durationSeconds`. */
export function circularCountdown(durationSeconds: number, nowMs: number): number {
  if (durationSeconds <= 0) return 0;
  const elapsed = Math.floor(nowMs / 1000) % durationSeconds;
  return elapsed === 0 ? durationSeconds : durationSeconds - elapsed;
}

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
