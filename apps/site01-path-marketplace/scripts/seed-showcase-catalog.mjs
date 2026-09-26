// Seeds the Supabase catalog with the storefront's showcase products (the same
// names/categories/prices as lib/placeholders.ts) using real images uploaded
// from temp_assets/ into the public `characters` and `toys` storage buckets.
//
// Usage (from apps/site01-path-marketplace):  node scripts/seed-showcase-catalog.mjs
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
// Idempotent: buckets are created if missing, uploads overwrite, products
// upsert by slug, variants upsert by sku. The key is never printed.
// Afterwards run `pnpm images:optimize` (pregen variants + blurhashes).

import { createClient } from "@supabase/supabase-js";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Env: parse .env.local directly (no dotenv dependency).
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// Products: 12 showcase items (verbatim from lib/placeholders.ts) + 7 extras
// so every category has at least 2–3 items. `bucket` picks the image source:
// photographed toys come from `toys`, everything else from `characters`.
// [title, series(subtitle), character, price, category, type, collectible, edition, soldOut, bucket]
const PRODUCTS = [
  ["Fantasia Blind Box", "Vol.8", "Molly", 16.99, "collectible_toys", "physical", true, null, false, "characters"],
  ["The Monsters S3", "Designer Figure", "Labubu", 24.99, "figures", "physical", false, null, false, "toys"],
  ["Dark Side Constructor", "Build Series Vol.2", "Skullpanda", 59.99, "toys", "physical", true, 200, false, "toys"],
  ["Art Universe Pack", "Digital Prints", "Crybaby", 9.99, "designs", "digital", false, null, false, "characters"],
  ["Aquarium World 400%", "Mega Figure", "Dimoo", 89.99, "figures", "physical", false, null, false, "toys"],
  ["Little Mermaid Vol.3", "Blind Box", "Hirono", 18.99, "collectible_toys", "physical", true, null, false, "characters"],
  ["Space Travel Comic", "Graphic Novel Vol.1", "Dimoo", 19.99, "books", "physical", false, null, false, "characters"],
  ["× Picasso Figure", "Collab Edition", "Molly", 39.99, "figures", "physical", false, null, true, "toys"],
  ["Bear Plush Duo", "Plush Collection", "Crybaby", 12.99, "toys", "physical", false, null, false, "characters"],
  ["Vol.3 Art Compendium", "Art Book", "Labubu", 34.99, "artbooks", "physical", false, null, false, "characters"],
  ["Chaos Friends Trio", "Collector Set", "Labubu", 54.99, "collectible_toys", "physical", true, null, false, "toys"],
  ["Fantasy Clowns Vol.1", "Blind Box", "Hirono", 16.99, "collectible_toys", "physical", true, 300, false, "characters"],
  // Extras for thin categories
  ["Tears Sticker Set", "Digital Stickers", "Crybaby", 7.99, "designs", "digital", false, null, false, "characters"],
  ["Night Shift Wallpapers", "Wallpaper Bundle", "Skullpanda", 4.99, "designs", "digital", false, null, false, "characters"],
  ["Little Wanderer", "Picture Book", "Hirono", 22.99, "books", "physical", false, null, false, "characters"],
  ["Sketchbook Vol.2", "Art Book", "Molly", 29.99, "artbooks", "physical", false, null, false, "characters"],
  ["Monsters Tote Bag", "Canvas Tote", "Labubu", 19.99, "merch", "physical", false, null, false, "characters"],
  ["Deep Sea Pin Set", "Enamel Pins", "Dimoo", 14.99, "merch", "physical", false, null, false, "characters"],
  ["Fantasia Hoodie", "Apparel", "Molly", 49.99, "merch", "physical", false, null, false, "characters"],
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/×/g, "x")
    .replace(/%/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Storage-safe object names: IMG_0818.webp → img-0818.webp,
// "Иллюстрация_без_названия 5.webp" → illustration-05.webp (bare one → 01).
function objectName(file) {
  const img = file.match(/^IMG_(\d+)\.webp$/i);
  if (img) return `img-${img[1]}.webp`;
  const n = file.match(/(\d+)\.webp$/);
  return `illustration-${String(n ? Number(n[1]) : 1).padStart(2, "0")}.webp`;
}

// 1. Buckets: public read, created only if missing.
async function ensureBucket(name) {
  const { data } = await supabase.storage.getBucket(name);
  if (data) return;
  const { error } = await supabase.storage.createBucket(name, { public: true });
  if (error) throw new Error(`createBucket ${name}: ${error.message}`);
  console.log(`created bucket ${name}`);
}

// 2. Upload every non-empty file in temp_assets/<bucket>, return public URLs.
async function uploadFolder(bucket) {
  const dir = join("temp_assets", bucket);
  const urls = [];
  for (const file of readdirSync(dir).sort()) {
    const path = join(dir, file);
    if (statSync(path).size === 0) {
      console.warn(`skipped empty file ${bucket}/${file}`);
      continue;
    }
    const name = objectName(file);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(name, readFileSync(path), { contentType: "image/webp", upsert: true });
    if (error) throw new Error(`upload ${bucket}/${name}: ${error.message}`);
    urls.push(supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl);
  }
  console.log(`uploaded ${urls.length} files to ${bucket}`);
  return urls;
}

async function main() {
  // Fail early (before uploading) if the schema isn't applied yet.
  const probe = await supabase.from("products").select("id", { head: true, count: "exact" });
  if (probe.error) throw new Error(`products table not reachable: ${probe.error.message}`);

  await ensureBucket("characters");
  await ensureBucket("toys");
  const pools = { characters: await uploadFolder("characters"), toys: await uploadFolder("toys") };

  // 3. Assign images: one primary per product from its bucket, in order;
  // leftover images of that bucket become extra gallery images round-robin.
  const cursor = { characters: 0, toys: 0 };
  const rows = PRODUCTS.map(([title, series, character, price, category, type, collectible, edition, , bucket]) => ({
    slug: slugify(`${character} ${title}`),
    title,
    description: `${character} — ${title}. ${series}.`,
    category,
    product_type: type,
    character: character.toLowerCase(),
    is_collectible: collectible,
    edition_size: edition,
    series,
    images: [{ url: pools[bucket][cursor[bucket]++ % pools[bucket].length], alt: `${character} — ${title}` }],
    base_price: price,
    currency: "USD",
    status: "active",
  }));
  for (const bucket of ["characters", "toys"]) {
    const owners = rows.filter((_, i) => PRODUCTS[i][9] === bucket);
    pools[bucket].slice(cursor[bucket]).forEach((url, i) => {
      const row = owners[i % owners.length];
      row.images.push({ url, alt: row.images[0].alt });
    });
  }

  // Keep metadata written by the backfill scripts (blurhash, pregen variants)
  // for images whose URL didn't change, so re-seeding doesn't wipe it.
  const { data: existing } = await supabase.from("products").select("images").in("slug", rows.map((r) => r.slug));
  const metaByUrl = new Map(
    (existing ?? []).flatMap((p) => (Array.isArray(p.images) ? p.images : [])).map((img) => [img.url, img])
  );
  for (const row of rows) {
    row.images = row.images.map((img) => ({ ...metaByUrl.get(img.url), ...img }));
  }

  // 4. Products (upsert by slug) + one default variant each (upsert by sku).
  const { data: saved, error } = await supabase.from("products").upsert(rows, { onConflict: "slug" }).select("id, slug");
  if (error) throw new Error(`products upsert: ${error.message}`);

  const soldOut = new Set(PRODUCTS.filter((p) => p[8]).map((p) => slugify(`${p[2]} ${p[0]}`)));
  const variants = saved.map(({ id, slug }) => {
    const row = rows.find((r) => r.slug === slug);
    const stock = soldOut.has(slug) ? 0 : row.product_type === "digital" ? 9999 : row.edition_size ?? 25;
    return { product_id: id, sku: `${slug.toUpperCase()}-STD`, attributes: { edition: "standard" }, stock };
  });
  const v = await supabase.from("product_variants").upsert(variants, { onConflict: "sku" });
  if (v.error) throw new Error(`variants upsert: ${v.error.message}`);

  // Summary: products per category.
  const counts = rows.reduce((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
  console.log(`upserted ${saved.length} products, ${variants.length} variants`, counts);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
