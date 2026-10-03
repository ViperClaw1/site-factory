import "server-only";

import { COVER_BUCKET, CATEGORIES } from "@/lib/admin/catalog";
import { extensionForMime, IMAGE_MAX_BYTES, type CourseInput, type SignRequest } from "@/lib/admin/schema";
import { courseSlug, slugify } from "@/lib/admin/slug";
import { ADMIN_PAGE_SIZE, type AdminCourseRow, type AdminStats } from "@/lib/admin/types";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import type { CourseStatus } from "@repo/types";
import { encode } from "blurhash";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

const VARIANTS = {
  thumb: { width: 400, quality: 70 },
  gallery: { width: 960, quality: 75 },
  hero: { width: 1600, quality: 80 },
} as const;

const readyBuckets = new Set<string>();

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

export class CourseMissingError extends Error {
  readonly status = 404;
  constructor() {
    super("not_found");
  }
}

function variantPath(path: string, variant: string): string {
  return path.replace(/\.[^./]+$/, "") + `_${variant}.webp`;
}

function isSafePath(slug: string, path: string): boolean {
  if (!path || path.includes("..") || path.includes("\\") || path.includes("\0") || path.startsWith("/")) return false;
  const rest = path.startsWith(`${slug}/`) ? path.slice(slug.length + 1) : "";
  return rest.length > 0 && !rest.includes("/");
}

function publicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Course admin requires NEXT_PUBLIC_SUPABASE_URL.");
  return `${base}/storage/v1/object/public/${COVER_BUCKET}/${path}`;
}

async function slugTaken(slug: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("courses").select("id").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export async function uniqueSlug(title: string): Promise<string> {
  const root = courseSlug(title);
  if (!root) throw new AdminInputError("Slug is empty.");
  for (let n = 1; n <= 50; n += 1) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await slugTaken(candidate))) return candidate;
  }
  throw new AdminInputError("Could not find a free slug.");
}

async function ensureBucket(): Promise<void> {
  if (readyBuckets.has(COVER_BUCKET)) return;
  const storage = supabaseAdmin().storage;
  const existing = await storage.getBucket(COVER_BUCKET);
  if (!existing.data) {
    const created = await storage.createBucket(COVER_BUCKET, { public: true });
    if (created.error && !/exist/i.test(created.error.message)) throw created.error;
  }
  readyBuckets.add(COVER_BUCKET);
}

export async function signCover(input: SignRequest): Promise<{ slug: string; bucket: string; path: string; token: string }> {
  await ensureBucket();
  const slug = await uniqueSlug(input.title);
  const path = `${slug}/${nanoid(10)}.${extensionForMime(input.file.mime)}`;
  const signed = await supabaseAdmin().storage.from(COVER_BUCKET).createSignedUploadUrl(path);
  if (signed.error || !signed.data) throw new Error(signed.error?.message ?? "Could not sign the upload.");
  return { slug, bucket: COVER_BUCKET, path, token: signed.data.token };
}

async function blurhashFrom(bytes: Buffer): Promise<string> {
  const sharp = (await import("sharp")).default;
  const { data, info } = await sharp(bytes).resize(32, 32, { fit: "cover" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height, 4, 3);
}

async function processCover(slug: string, objectPath: string): Promise<{ url: string; meta: { blurhash: string; variants: string[]; v: string } }> {
  if (!isSafePath(slug, objectPath)) throw new AdminInputError("Cover path is not valid.");
  const downloaded = await supabaseAdmin().storage.from(COVER_BUCKET).download(objectPath);
  if (downloaded.error || !downloaded.data) throw new AdminInputError("Cover file is missing.");
  const bytes = Buffer.from(await downloaded.data.arrayBuffer());
  if (bytes.length > IMAGE_MAX_BYTES) throw new AdminInputError("Cover must be 15 MB or smaller.");

  const sharp = (await import("sharp")).default;
  let source: Buffer;
  try {
    source = await sharp(bytes).rotate().png().toBuffer();
  } catch {
    throw new AdminInputError("Cover is not a valid image.");
  }

  const webpPath = objectPath.replace(/\.[^./]+$/, ".webp");
  const webp = await sharp(source).webp({ quality: 82, effort: 5 }).toBuffer();
  const uploaded = await supabaseAdmin().storage.from(COVER_BUCKET).upload(webpPath, webp, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: true,
  });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const variants: string[] = [];
  for (const [variant, spec] of Object.entries(VARIANTS)) {
    const body = await sharp(source).resize({ width: spec.width, withoutEnlargement: true }).webp({ quality: spec.quality, effort: 5 }).toBuffer();
    const path = variantPath(webpPath, variant);
    const variantUpload = await supabaseAdmin().storage.from(COVER_BUCKET).upload(path, body, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: true,
    });
    if (variantUpload.error) throw new Error(variantUpload.error.message);
    variants.push(variant);
  }

  if (webpPath !== objectPath) await supabaseAdmin().storage.from(COVER_BUCKET).remove([objectPath]);
  return { url: publicUrl(webpPath), meta: { blurhash: await blurhashFrom(webp), variants, v: nanoid(8) } };
}

function baseCopy(translations: CourseInput["translations"]): { language: string; title: string; subtitle: string | null; description: string | null; i18n: Record<string, { title?: string; subtitle?: string; description?: string }> } {
  const filled = Object.entries(translations).filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => {
    const copy = entry[1];
    return Boolean(copy && copy.title.trim().length >= 2);
  });
  const preferred = filled.find(([code]) => code === "en") ?? filled[0];
  if (!preferred) throw new AdminInputError("Add a title for one language.");
  const [language, copy] = preferred;
  const i18n: Record<string, { title?: string; subtitle?: string; description?: string }> = {};
  for (const [code, item] of filled) {
    if (code === language) continue;
    i18n[code] = {
      title: item.title.trim(),
      ...(item.subtitle.trim() ? { subtitle: item.subtitle.trim() } : {}),
      ...(item.description.trim() ? { description: item.description.trim() } : {}),
    };
  }
  return {
    language,
    title: copy.title.trim(),
    subtitle: copy.subtitle.trim() || null,
    description: copy.description.trim() || null,
    i18n,
  };
}

function revalidateCourse(slug: string): void {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/course/${slug}`);
}

export async function createCourse(input: CourseInput): Promise<{ id: string; slug: string }> {
  const slug = slugify(input.slug);
  if (await slugTaken(slug)) throw new SlugTakenError();
  if (!isSafePath(slug, input.coverPath)) throw new AdminInputError("Cover path is not valid.");

  let cover: { url: string; meta: { blurhash: string; variants: string[]; v: string } };
  try {
    cover = await processCover(slug, input.coverPath);
  } catch (err) {
    await supabaseAdmin().storage.from(COVER_BUCKET).remove([input.coverPath]).catch(() => undefined);
    throw err;
  }

  const text = baseCopy(input.translations);
  const inserted = await supabaseAdmin()
    .from("courses")
    .insert({
      slug,
      title: text.title,
      subtitle: text.subtitle,
      description: text.description,
      language: text.language,
      i18n: text.i18n,
      category: input.category,
      level: input.level,
      tags: input.tags,
      cover_image: cover.url,
      cover_meta: cover.meta,
      promo_video_url: input.promoVideoUrl ?? null,
      price: input.price,
      currency: input.currency,
      instructor_id: input.instructorId,
      duration_minutes: input.durationMinutes,
      badge: input.badge,
      status: input.status,
    })
    .select("id")
    .single();

  if (inserted.error) {
    await supabaseAdmin().storage.from(COVER_BUCKET).remove([input.coverPath.replace(/\.[^./]+$/, ".webp"), ...Object.keys(VARIANTS).map((variant) => variantPath(input.coverPath.replace(/\.[^./]+$/, ".webp"), variant))]);
    if (inserted.error.code === "23505") throw new SlugTakenError();
    throw new Error(inserted.error.message);
  }

  revalidateCourse(slug);
  return { id: inserted.data.id, slug };
}

async function removeCoverFiles(slug: string, coverUrl: string | null): Promise<void> {
  const paths = new Set<string>();
  const listed = await supabaseAdmin().storage.from(COVER_BUCKET).list(slug, { limit: 1000 });
  if (!listed.error) {
    for (const entry of listed.data ?? []) {
      if (entry.name && isSafePath(slug, `${slug}/${entry.name}`)) paths.add(`${slug}/${entry.name}`);
    }
  }
  const marker = `/object/public/${COVER_BUCKET}/`;
  const index = coverUrl?.indexOf(marker) ?? -1;
  if (coverUrl && index >= 0) {
    const objectPath = decodeURIComponent(coverUrl.slice(index + marker.length).split(/[?#]/)[0] ?? "");
    if (isSafePath(slug, objectPath)) {
      paths.add(objectPath);
      for (const variant of Object.keys(VARIANTS)) paths.add(variantPath(objectPath, variant));
    }
  }
  if (paths.size > 0) await supabaseAdmin().storage.from(COVER_BUCKET).remove([...paths]);
}

export async function deleteCourse(id: string): Promise<{ slug: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new CourseMissingError();
  const { data, error } = await supabaseAdmin().from("courses").select("id, slug, cover_image").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new CourseMissingError();

  const removed = await supabaseAdmin().from("courses").delete().eq("id", data.id).select("id");
  if (removed.error) throw new Error(removed.error.message);
  if (!removed.data?.length) throw new CourseMissingError();

  await removeCoverFiles(data.slug, data.cover_image).catch(() => undefined);
  revalidateCourse(data.slug);
  return { slug: data.slug };
}

export interface CourseListQuery {
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
  const { count, error } = await supabaseAdmin().from("courses").select("id", { count: "exact", head: true }).eq(column, value);
  if (error) throw error;
  return count ?? 0;
}

export async function listCourses(query: CourseListQuery): Promise<{
  items: AdminCourseRow[];
  total: number;
  page: number;
  stats: AdminStats;
}> {
  const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? Math.floor(query.page as number) : 1;
  const category = query.category && (CATEGORIES as readonly string[]).includes(query.category) ? query.category : undefined;
  const status = query.status === "active" || query.status === "draft" || query.status === "archived" ? query.status : undefined;
  const q = searchTerm(query.q);

  let list = supabaseAdmin()
    .from("courses")
    .select("id, slug, title, category, price, currency, status, language, cover_image, updated_at", { count: "exact" });
  if (category) list = list.eq("category", category);
  if (status) list = list.eq("status", status);
  if (q) list = list.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);

  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const [rows, totalCount, statusCounts, categoryCounts] = await Promise.all([
    list.order("updated_at", { ascending: false }).range(from, from + ADMIN_PAGE_SIZE - 1),
    supabaseAdmin().from("courses").select("id", { count: "exact", head: true }),
    Promise.all((["active", "draft", "archived"] as const).map(async (value) => [value, await headCount("status", value)] as const)),
    Promise.all(CATEGORIES.map(async (value) => [value, await headCount("category", value)] as const)),
  ]);

  if (rows.error) throw rows.error;
  if (totalCount.error) throw totalCount.error;

  const items: AdminCourseRow[] = (rows.data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category ?? "",
    price: Number(row.price),
    currency: row.currency,
    status: row.status as CourseStatus,
    language: row.language,
    coverUrl: row.cover_image,
    updatedAt: row.updated_at,
  }));

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
