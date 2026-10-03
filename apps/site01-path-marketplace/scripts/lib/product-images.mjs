// Shared helpers for the product-image backfill scripts (pregen variants,
// thumbs, blurhashes). The image pipeline itself lives in lib/media/pipeline.mjs
// so the admin uploader and these scripts share one implementation.
//
// Product images live in public Supabase Storage buckets and are referenced
// from products.images (jsonb) as
//   { url, alt?, blurhash?, variants?: ("thumb" | "gallery" | "hero")[], v? }

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

export {
  blurhashFromBytes,
  isVariantPath,
  parseStorageUrl,
  prepareSource,
  PRODUCT_IMAGE_BUCKETS,
  PRODUCT_IMAGE_VARIANTS,
  renderVariant,
  uploadVariant,
  variantObjectPath,
} from "../../lib/media/pipeline.mjs";

// Env + client ---------------------------------------------------------------

// Parse .env.local directly (no dotenv dependency). Never log the values.
export function loadEnv() {
  const env = Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      })
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return { url: url.replace(/\/$/, ""), serviceKey };
}

export function createSupabaseAdmin() {
  const { url, serviceKey } = loadEnv();
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export function log(tag, message) {
  console.log(`[${tag}] ${message}`);
}

export function errorMessage(err) {
  return err instanceof Error ? err.message : String(err);
}

// CLI args: supports `--name value` and `--name=value`.
export function argValue(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

export function parseLimit(args, fallback) {
  const limit = Number.parseInt(argValue(args, "--limit") ?? "", 10);
  return Number.isFinite(limit) && limit > 0 ? limit : fallback;
}

// Existence check via a filtered listing — avoids downloading the object.
export async function objectExists(supabase, bucket, objectPath) {
  const slash = objectPath.lastIndexOf("/");
  const dir = slash >= 0 ? objectPath.slice(0, slash) : "";
  const name = objectPath.slice(slash + 1);
  const { data, error } = await supabase.storage.from(bucket).list(dir, { search: name, limit: 100 });
  if (error) throw error;
  return (data ?? []).some((entry) => entry.name === name);
}

export async function downloadObject(supabase, bucket, objectPath) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function fetchProducts(supabase, { limit, slug }) {
  let query = supabase.from("products").select("id, slug, images").order("created_at", { ascending: false });
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function saveProductImages(supabase, productId, images) {
  const { error } = await supabase.from("products").update({ images }).eq("id", productId);
  if (error) throw error;
}
