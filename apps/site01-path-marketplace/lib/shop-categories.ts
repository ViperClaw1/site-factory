import type { PillOption } from "@/components/CategoryPills";
import { CATEGORIES } from "./catalog-taxonomy.mjs";
import type { MessageKey } from "./i18n";

export type { Category } from "./catalog-taxonomy.mjs";
export { CATEGORIES };

export const SHOP_CATEGORY_OPTIONS: PillOption[] = CATEGORIES.map((value) => ({
  value,
  label: value.replace(/_/g, " "),
  labelKey: `category.${value}` as MessageKey,
}));

// Translation key for a /shop/[category] segment, or null for unknown slugs.
export function categoryLabelKey(category: string): MessageKey | null {
  return (CATEGORIES as readonly string[]).includes(category) ? (`category.${category}` as MessageKey) : null;
}
