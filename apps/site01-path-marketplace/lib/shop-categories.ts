import type { PillOption } from "@/components/CategoryPills";
import type { MessageKey } from "./i18n";

// Fixed taxonomy matching the seeded product categories (see Phase 1 schema).
const CATEGORIES = ["toys", "collectible_toys", "books", "artbooks", "designs", "merch", "figures"] as const;

export const SHOP_CATEGORY_OPTIONS: PillOption[] = CATEGORIES.map((value) => ({
  value,
  label: value.replace(/_/g, " "),
  labelKey: `category.${value}` as MessageKey,
}));

// Translation key for a /shop/[category] segment, or null for unknown slugs.
export function categoryLabelKey(category: string): MessageKey | null {
  return (CATEGORIES as readonly string[]).includes(category) ? (`category.${category}` as MessageKey) : null;
}
