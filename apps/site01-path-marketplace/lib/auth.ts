"use client";

import { createSupabaseBrowserClient } from "@repo/lib";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { roleOf, type Role } from "./rbac";

// One browser client for the whole app — it owns session storage + token refresh.
let client: SupabaseClient | null = null;
export function supabaseBrowser(): SupabaseClient {
  client ??= createSupabaseBrowserClient();
  return client;
}

interface AuthState {
  user: User | null;
  role: Role;
  // False until Supabase reports the initial session — lets the UI avoid
  // flashing guest controls for a signed-in visitor.
  ready: boolean;
  // Product ids in the signed-in user's wishlist (table `wishlists`).
  favorites: Set<string>;
  toggleFavorite: (productId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  role: "guest",
  ready: false,
  favorites: new Set(),

  // Optimistic toggle; reverts if the insert/delete is rejected.
  toggleFavorite: async (productId) => {
    const { user, favorites } = get();
    if (!user) return;
    const wasFavorite = favorites.has(productId);
    const next = new Set(favorites);
    if (wasFavorite) next.delete(productId);
    else next.add(productId);
    set({ favorites: next });

    const wishlists = supabaseBrowser().from("wishlists");
    const { error } = wasFavorite
      ? await wishlists.delete().eq("user_id", user.id).eq("product_id", productId)
      : await wishlists.insert({ user_id: user.id, product_id: productId });
    if (error) set({ favorites });
  },
}));

async function loadFavorites(userId: string) {
  const { data } = await supabaseBrowser().from("wishlists").select("product_id").eq("user_id", userId);
  if (useAuthStore.getState().user?.id !== userId) return; // signed out meanwhile
  useAuthStore.setState({ favorites: new Set((data ?? []).map((row) => row.product_id as string)) });
}

// Subscribes the store to Supabase auth events. Called once by <NavBar>
// (it's on every page, same as the cart/locale rehydrate); returns the unsubscribe.
export function initAuth(): () => void {
  const {
    data: { subscription },
  } = supabaseBrowser().auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    const previousId = useAuthStore.getState().user?.id;
    useAuthStore.setState({
      user,
      role: roleOf(user),
      ready: true,
      ...(user ? {} : { favorites: new Set<string>() }),
    });
    // Deferred: awaiting Supabase calls inside this callback deadlocks the auth lock.
    if (user && user.id !== previousId) setTimeout(() => void loadFavorites(user.id), 0);
  });
  return () => subscription.unsubscribe();
}
