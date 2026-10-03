import "server-only";

import { bucketForCategory, CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import {
  blurhashFromBytes,
  parseStorageUrl,
  prepareSource,
  renderVariant,
  uploadVariant,
  variantObjectPath,
} from "@/lib/media/pipeline.mjs";
import { coverImage } from "@/lib/media";
import {
  extensionForMime,
  IMAGE_MAX_BYTES,
  MAX_MEDIA_FILES,
  VIDEO_MAX_BYTES,
  type ProductInput,
  type SignRequest,
} from "@/lib/admin/schema";
import { productSlug, slugify } from "@/lib/admin/slug";
import { ADMIN_PAGE_SIZE, type AdminProductRow, type AdminStats } from "@/lib/admin/types";
import { requireAdmin } from "@/lib/server/require-admin";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import type { ProductImage, ProductImageVariant, ProductStatus } from "@repo/types";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

const VARIANT_ORDER = ["thumb", "gallery", "hero"] as const;
const IMAGE_FORMATS = new Set(["jpeg", "png", "webp", "avif", "heif"]);
const BUCKET_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"];
const readyBuckets = new Set<string>();

export class AdminAuthError extends Error {
  constructor(readonly status: 401 | 404) {
    super(status === 401 ? "unauthorized" : "not_found");
  }
}

export class AdminInputError extends Error {
  readonly status = 400;
  fieldErrors?: Record<string, string>;
  constructor(message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

export class SlugTakenError extends Error {
  readonly status = 409;
  constructor() {
    super("slug_taken");
  }
}

export class ProductMissingError extends Error {
  readonly status = 404;
  constructor() {
    super("not_found");
  }
}

async function gate(): Promise<void> {
  const result = await requireAdmin();
  if (!result.ok) throw new AdminAuthError(result.status);
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function isSafePath(slug: string, path: string): boolean {
  if (!path || path.includes("..") || path.includes("\\") || path.includes("\0") || path.startsWith("/")) return false;
  const rest = path.startsWith(`${slug}/`) ? path.slice(slug.length + 1) : "";
  return rest.length > 0 && !rest.includes("/");
}

async function slugTaken(slug: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("products").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function uniqueSlug(requested: string): Promise<string> {
  const root = slugify(requested);
  if (!root) throw new AdminInputError("Slug is empty.");
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await slugTaken(candidate))) return candidate;
  }
  throw new AdminInputError("Could not find a free slug.");
}

export async function ensureBucket(name: string): Promise<void> {
  if (readyBuckets.has(name)) return;
  const storage = supabaseAdmin().storage;
  const existing = await storage.getBucket(name);
  if (!existing.data) {
    const created = await storage.createBucket(name, { public: true });
    if (created.error && !/exist/i.test(created.error.message)) throw created.error;
  }
  // 200 MiB matches the admin cap. This project's Storage API rejects that
  // (global cap is 50 MiB), so fall back rather than failing the upload.
  const desired = await storage.updateBucket(name, {
    public: true,
    fileSizeLimit: 209715200,
    allowedMimeTypes: BUCKET_MIME,
  });
  if (desired.error) {
    const fallback = await storage.updateBucket(name, {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: BUCKET_MIME,
    });
    if (fallback.error && !existing.data) throw fallback.error;
  }
  readyBuckets.add(name);
}

async function downloadObject(bucket: string, objectPath: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin().storage.from(bucket).download(objectPath);
  if (error || !data) throw new AdminInputError(`Missing file ${objectPath}.`);
  return Buffer.from(await data.arrayBuffer());
}

async function objectExists(bucket: string, objectPath: string): Promise<boolean> {
  const slash = objectPath.lastIndexOf("/");
  const dir = slash >= 0 ? objectPath.slice(0, slash) : "";
  const name = objectPath.slice(slash + 1);
  const { data, error } = await supabaseAdmin().storage.from(bucket).list(dir, { search: name, limit: 100 });
  if (error) throw error;
  return (data ?? []).some((entry) => entry.name === name);
}

async function removeQuiet(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  await supabaseAdmin().storage.from(bucket).remove(paths);
}

export async function cleanupObjects(bucket: string, slug: string, paths: string[]): Promise<void> {
  const candidates = [
    ...new Set(paths.flatMap((path) => [path, ...VARIANT_ORDER.map((variant) => variantObjectPath(path, variant))])),
  ].filter((path) => isSafePath(slug, path));
  if (candidates.length === 0) return;

  const { data } = await supabaseAdmin().from("products").select("images").eq("slug", slug).maybeSingle();
  const keep = new Set<string>();
  const images = Array.isArray(data?.images) ? (data.images as ProductImage[]) : [];
  for (const image of images) {
    for (const url of [image?.url, image?.poster]) {
      const ref = parseStorageUrl(url ?? "");
      if (ref?.bucket === bucket) keep.add(ref.objectPath);
    }
  }
  const removable = candidates.filter((path) => !keep.has(path));
  if (removable.length > 0) await removeQuiet(bucket, removable);
}

async function readImage(bucket: string, path: string): Promise<{ bytes: Buffer; width?: number; height?: number; mime: string }> {
  const bytes = await downloadObject(bucket, path);
  if (bytes.length > IMAGE_MAX_BYTES) {
    await removeQuiet(bucket, [path]);
    throw new AdminInputError(`${path} is larger than 15 MB.`);
  }
  const sharp = (await import("sharp")).default;
  let meta;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    await removeQuiet(bucket, [path]);
    throw new AdminInputError(`${path} is not a valid image.`);
  }
  if (!meta.format || !IMAGE_FORMATS.has(meta.format)) {
    await removeQuiet(bucket, [path]);
    throw new AdminInputError(`${path} is not a valid image.`);
  }
  const mime = meta.format === "jpeg" ? "image/jpeg" : meta.format === "heif" ? "image/avif" : `image/${meta.format}`;
  return { bytes, width: meta.width, height: meta.height, mime };
}

function videoMime(bytes: Buffer): "video/mp4" | "video/webm" | null {
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") return "video/mp4";
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  return null;
}

async function processImage(bucket: string, path: string, alt: string): Promise<{ image: ProductImage; warnings: string[] }> {
  const { bytes, width, height, mime } = await readImage(bucket, path);
  const warnings: string[] = [];
  const image: ProductImage = {
    type: "image",
    url: supabaseAdmin().storage.from(bucket).getPublicUrl(path).data.publicUrl,
    alt,
    mime,
    width,
    height,
  };

  try {
    const source = await prepareSource(bytes);
    const present: ProductImageVariant[] = [];
    let thumb: Buffer | null = null;
    for (const variant of VARIANT_ORDER) {
      try {
        await uploadVariant(supabaseAdmin(), bucket, path, source, variant);
        present.push(variant);
        if (variant === "thumb") thumb = await renderVariant(source, variant);
      } catch (err) {
        warnings.push(`${path} ${variant}: ${message(err)}`);
      }
    }
    if (thumb) {
      try {
        image.blurhash = await blurhashFromBytes(thumb);
      } catch (err) {
        warnings.push(`${path} blurhash: ${message(err)}`);
      }
    }
    if (present.length > 0) {
      image.variants = present;
      image.v = Date.now().toString(36);
    }
  } catch (err) {
    warnings.push(`${path}: ${message(err)}`);
  }

  return { image, warnings };
}

async function processMedia(
  bucket: string,
  slug: string,
  media: ProductInput["media"],
  title: string
): Promise<{ images: ProductImage[]; warnings: string[] }> {
  const images: ProductImage[] = [];
  const warnings: string[] = [];

  for (const item of media) {
    if (!isSafePath(slug, item.path) || !(await objectExists(bucket, item.path))) {
      throw new AdminInputError(`Missing file ${item.path}.`);
    }
    const alt = item.alt?.trim() || title;
    if (item.type === "image") {
      const processed = await processImage(bucket, item.path, alt);
      images.push(processed.image);
      warnings.push(...processed.warnings);
      continue;
    }

    if (!item.posterPath || !isSafePath(slug, item.posterPath)) {
      throw new AdminInputError("Each video needs a poster image.");
    }
    const bytes = await downloadObject(bucket, item.path);
    if (bytes.length > VIDEO_MAX_BYTES) {
      await removeQuiet(bucket, [item.path]);
      throw new AdminInputError(`${item.path} is larger than 200 MB.`);
    }
    const mime = videoMime(bytes);
    if (!mime) {
      await removeQuiet(bucket, [item.path]);
      throw new AdminInputError(`${item.path} is not an MP4 or WebM file.`);
    }
    const poster = await processImage(bucket, item.posterPath, alt);
    warnings.push(...poster.warnings);
    images.push({
      type: "video",
      url: supabaseAdmin().storage.from(bucket).getPublicUrl(item.path).data.publicUrl,
      alt,
      mime,
      poster: poster.image.url,
      posterBlurhash: poster.image.blurhash,
      posterVariants: poster.image.variants,
      v: poster.image.v,
    });
  }

  return { images, warnings };
}

function revalidateCatalog(category: string, slug: string): void {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath(`/shop/${category}`);
  revalidatePath(`/p/${slug}`);
}

export async function signUploads(input: SignRequest): Promise<{
  slug: string;
  bucket: string;
  uploads: { name: string; path: string; token: string }[];
}> {
  await gate();
  const mediaCount = input.files.filter((file) => file.role === "media").length;
  if (mediaCount < 1 || mediaCount > MAX_MEDIA_FILES) throw new AdminInputError("Add between 1 and 20 files.");
  for (const file of input.files) {
    const limit = file.mime.startsWith("video/") ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
    if (file.role === "poster" && file.mime.startsWith("video/")) throw new AdminInputError("A poster must be an image.");
    if (file.size > limit) throw new AdminInputError(`${file.name} is too large.`);
  }

  const bucket = bucketForCategory(input.category);
  await ensureBucket(bucket);
  const slug = await uniqueSlug(slugify(input.slug || "") || productSlug(input.title, input.character));
  const uploads: { name: string; path: string; token: string }[] = [];

  for (const file of input.files) {
    const ext = extensionForMime(file.mime);
    if (!ext) throw new AdminInputError("Unsupported file type.");
    const path = `${slug}/${nanoid(10)}.${ext}`;
    const signed = await supabaseAdmin().storage.from(bucket).createSignedUploadUrl(path);
    if (signed.error || !signed.data?.token) throw new Error(signed.error?.message || "Could not sign the upload.");
    uploads.push({ name: file.name, path, token: signed.data.token });
  }

  return { slug, bucket, uploads };
}

interface ProductWrite {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  product_type: "physical" | "digital";
  character: string | null;
  is_collectible: boolean;
  edition_size: number | null;
  series: string | null;
  images: ProductImage[];
  base_price: number;
  currency: string;
  status: "active" | "draft";
  stock: number;
}

function isMissingRpc(message: string): boolean {
  return /admin_create_product|schema cache|PGRST202/i.test(message);
}

// Prefer the migration's single transaction. If it is not applied yet, insert
// the product and remove it when the variant insert fails.
async function insertProduct(row: ProductWrite): Promise<string> {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.rpc("admin_create_product", { p: row });
  if (!error) return String(data);
  if (error.code === "23505") throw new SlugTakenError();
  if (!isMissingRpc(error.message)) throw new Error(error.message);

  const inserted = await supabase
    .from("products")
    .insert({
      slug: row.slug,
      title: row.title,
      description: row.description,
      category: row.category,
      product_type: row.product_type,
      character: row.character,
      is_collectible: row.is_collectible,
      edition_size: row.edition_size,
      series: row.series,
      images: row.images,
      base_price: row.base_price,
      currency: row.currency,
      status: row.status,
    })
    .select("id")
    .single();
  if (inserted.error) {
    if (inserted.error.code === "23505") throw new SlugTakenError();
    throw new Error(inserted.error.message);
  }

  const variant = await supabase.from("product_variants").insert({
    product_id: inserted.data.id,
    sku: `${row.slug.toUpperCase()}-STD`,
    attributes: { edition: "standard" },
    stock: row.stock,
  });
  if (variant.error) {
    await supabase.from("products").delete().eq("id", inserted.data.id);
    if (variant.error.code === "23505") throw new SlugTakenError();
    throw new Error(variant.error.message);
  }
  return inserted.data.id;
}

export async function createProduct(input: ProductInput): Promise<{ id: string; slug: string; warnings: string[] }> {
  await gate();
  const bucket = bucketForCategory(input.category);
  const paths = input.media.flatMap((item) => (item.posterPath ? [item.path, item.posterPath] : [item.path]));
  let created: { id: string; slug: string; warnings: string[] };
  try {
    if (await slugTaken(input.slug)) throw new SlugTakenError();
    const { images, warnings } = await processMedia(bucket, input.slug, input.media, input.title);
    const id = await insertProduct({
      slug: input.slug,
      title: input.title,
      description: input.description ?? null,
      category: input.category,
      product_type: input.productType,
      character: input.character?.toLowerCase() ?? null,
      is_collectible: input.isCollectible,
      edition_size: input.editionSize ?? null,
      series: input.series ?? null,
      images,
      base_price: input.price,
      currency: "USD",
      status: input.status,
      stock: input.stock,
    });
    created = { id, slug: input.slug, warnings };
  } catch (err) {
    await cleanupObjects(bucket, input.slug, paths).catch(() => undefined);
    throw err;
  }
  revalidateCatalog(input.category, input.slug);
  return created;
}

const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mediaBuckets(category: string, images: ProductImage[]): string[] {
  const names = new Set<string>([bucketForCategory(category)]);
  for (const image of images) {
    for (const url of [image?.url, image?.poster]) {
      const ref = parseStorageUrl(url ?? "");
      if (ref) names.add(ref.bucket);
    }
  }
  return [...names];
}

async function productMediaPaths(bucket: string, slug: string, images: ProductImage[]): Promise<string[]> {
  const paths = new Set<string>();
  const listed = await supabaseAdmin().storage.from(bucket).list(slug, { limit: 1000 });
  if (!listed.error) {
    for (const entry of listed.data ?? []) {
      if (entry.name && isSafePath(slug, `${slug}/${entry.name}`)) paths.add(`${slug}/${entry.name}`);
    }
  }
  for (const image of images) {
    for (const url of [image?.url, image?.poster]) {
      const ref = parseStorageUrl(url ?? "");
      if (!ref || ref.bucket !== bucket || !isSafePath(slug, ref.objectPath)) continue;
      paths.add(ref.objectPath);
      for (const variant of VARIANT_ORDER) paths.add(variantObjectPath(ref.objectPath, variant));
    }
  }
  return [...paths];
}

export async function deleteProduct(id: string): Promise<{ slug: string; warnings: string[] }> {
  await gate();
  if (!PRODUCT_ID.test(id)) throw new ProductMissingError();

  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("id, slug, category, images")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ProductMissingError();

  const images = (Array.isArray(data.images) ? data.images : []) as ProductImage[];
  const buckets = mediaBuckets(data.category, images);
  const paths = new Map<string, string[]>();
  for (const bucket of buckets) {
    paths.set(bucket, await productMediaPaths(bucket, data.slug, images));
  }

  const removed = await supabaseAdmin().from("products").delete().eq("id", data.id).select("id");
  if (removed.error) throw new Error(removed.error.message);
  if (!removed.data?.length) throw new ProductMissingError();

  const warnings: string[] = [];
  for (const [bucket, objectPaths] of paths) {
    if (objectPaths.length === 0) continue;
    const storage = await supabaseAdmin().storage.from(bucket).remove(objectPaths);
    if (storage.error) warnings.push(`Could not remove files from ${bucket}.`);
  }

  revalidateCatalog(data.category, data.slug);
  return { slug: data.slug, warnings };
}

export interface ProductListQuery {
  category?: string;
  status?: string;
  q?: string;
  page?: number;
}

function searchTerm(q: string | undefined): string | null {
  const safe = (q ?? "").replace(/[%_,().]/g, " ").replace(/\s+/g, " ").trim();
  return safe.length > 0 ? safe : null;
}

async function headCount(column: "status" | "category", value: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

export async function listProducts(query: ProductListQuery): Promise<{
  items: AdminProductRow[];
  total: number;
  page: number;
  stats: AdminStats;
}> {
  await gate();
  const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? Math.floor(query.page as number) : 1;
  const category = query.category && (CATEGORIES as readonly string[]).includes(query.category) ? query.category : undefined;
  const status =
    query.status === "active" || query.status === "draft" || query.status === "archived" ? query.status : undefined;
  const q = searchTerm(query.q);

  let list = supabaseAdmin()
    .from("products")
    .select("id, slug, title, category, base_price, status, images, updated_at, product_variants(stock)", { count: "exact" });
  if (category) list = list.eq("category", category);
  if (status) list = list.eq("status", status);
  if (q) list = list.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);

  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const [rows, totalCount, statusCounts, categoryCounts] = await Promise.all([
    list.order("updated_at", { ascending: false }).range(from, from + ADMIN_PAGE_SIZE - 1),
    supabaseAdmin().from("products").select("id", { count: "exact", head: true }),
    Promise.all((["active", "draft", "archived"] as const).map(async (value) => [value, await headCount("status", value)] as const)),
    Promise.all(CATEGORIES.map(async (value) => [value, await headCount("category", value)] as const)),
  ]);

  if (rows.error) throw rows.error;
  if (totalCount.error) throw totalCount.error;

  const items: AdminProductRow[] = (rows.data ?? []).map((row) => {
    const images = (Array.isArray(row.images) ? row.images : []) as ProductImage[];
    const variants = (row.product_variants ?? []) as { stock: number }[];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      price: Number(row.base_price),
      status: row.status as ProductStatus,
      stock: variants.reduce((sum, variant) => sum + (variant.stock ?? 0), 0),
      mediaCount: images.length,
      thumbUrl: coverImage({ images })?.url ?? null,
      updatedAt: row.updated_at,
    };
  });

  return {
    items,
    total: rows.count ?? 0,
    page,
    stats: {
      total: totalCount.count ?? 0,
      byStatus: Object.fromEntries(statusCounts) as AdminStats["byStatus"],
      byCategory: Object.fromEntries(categoryCounts),
    },
  };
}
