"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  qty: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
}

// Client-only cart, persisted to localStorage. There is no server-side order
// yet — checkout (app/checkout) mocks a confirmation instead of charging a
// real payment provider. Real persistence + payment lands with the PayMesh
// Gateway integration (ТЗ v2.0, Implementation Plan Phase 3), currently
// blocked on keys from the Gateway team.
//
// skipHydration: true — the store starts empty on both server and first
// client render so SSR output matches; components that need the persisted
// cart call `useCartStore.persist.rehydrate()` once in a useEffect.
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, qty }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQty: (productId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "path-marketplace-cart", skipHydration: true }
  )
);

// Single-currency assumption — fine while the catalog is placeholder-only;
// revisit once real multi-currency products exist.
export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
