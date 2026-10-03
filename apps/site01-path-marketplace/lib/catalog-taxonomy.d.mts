export const CATEGORIES: readonly [
  "toys",
  "collectible_toys",
  "books",
  "artbooks",
  "designs",
  "merch",
  "figures",
];

export type Category = (typeof CATEGORIES)[number];

export function bucketForCategory(category: string): string;

export const CATALOG_BUCKETS: readonly string[];
