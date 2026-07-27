import "server-only";

import { createSupabasePublicClient } from "@repo/lib";
import { createDirectusClient, readItems } from "@repo/lib/directus";
import type { Character, Collection, Product } from "@repo/types";

const directus = createDirectusClient();

// CMS/DB calls have no default timeout — an unreachable Directus or Supabase
// instance would otherwise hang the request indefinitely instead of falling
// back to an empty catalog state.
const FETCH_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms = FETCH_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Directus: editorial collection/character content.
 * Products themselves live in Supabase — Directus only carries the
 * story/imagery an editor manages (hero image, series name, description).
 */

export async function getCollections(): Promise<Collection[]> {
  try {
    return await withTimeout(
      directus.request(
        readItems("collections", {
          filter: { status: { _eq: "published" } },
          sort: ["name"],
        })
      )
    );
  } catch (error) {
    console.error("getCollections failed", error);
    return [];
  }
}

export async function getCollection(slug: string): Promise<Collection | null> {
  try {
    const results = await withTimeout(
      directus.request(
        readItems("collections", {
          filter: { slug: { _eq: slug }, status: { _eq: "published" } },
          limit: 1,
        })
      )
    );
    return results[0] ?? null;
  } catch (error) {
    console.error("getCollection failed", error);
    return null;
  }
}

export async function getCharacters(): Promise<Character[]> {
  try {
    return await withTimeout(
      directus.request(
        readItems("characters", {
          filter: { status: { _eq: "published" } },
          sort: ["name"],
        })
      )
    );
  } catch (error) {
    console.error("getCharacters failed", error);
    return [];
  }
}

export async function getCharacter(slug: string): Promise<Character | null> {
  try {
    const results = await withTimeout(
      directus.request(
        readItems("characters", {
          filter: { slug: { _eq: slug }, status: { _eq: "published" } },
          limit: 1,
        })
      )
    );
    return results[0] ?? null;
  } catch (error) {
    console.error("getCharacter failed", error);
    return null;
  }
}

/**
 * Supabase: the product catalog itself.
 * Uses the anon-key public client — these are unauthenticated, cacheable
 * reads shared by every visitor, not per-user data.
 */

export interface ProductFilters {
  category?: string;
  collection?: string;
  character?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const supabase = createSupabasePublicClient();
  let query = supabase.from("products").select("*").eq("status", "active");

  if (filters.category) query = query.eq("category", filters.category);
  if (filters.collection) query = query.eq("collection", filters.collection);
  if (filters.character) query = query.eq("character", filters.character);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  try {
    const { data, error } = await query.abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS));
    if (error) {
      console.error("getProducts failed", error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    // Network-level failure (e.g. Supabase unreachable) — fail soft so the
    // page still renders an empty state instead of a 500.
    console.error("getProducts threw", error);
    return [];
  }
}

export function getProductsByCategory(category: string, filters: ProductFilters = {}) {
  return getProducts({ ...filters, category });
}
