import { usePlausible } from "next-plausible";

export interface PlausibleEvents {
  add_to_cart: { product_id: string; category: string };
  begin_checkout: { item_count: number; total: number };
  purchase: { order_id: string; provider: string; total: number };
  collectible_view: { product_id: string; chapters_count: number };
  [key: string]: Record<string, unknown>;
}

export function usePlausibleEvent() {
  return usePlausible<PlausibleEvents>();
}
