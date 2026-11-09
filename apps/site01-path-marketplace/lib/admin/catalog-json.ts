import { z } from "zod";
import {
  defaultStock,
  extensionForMime,
  fieldErrorsOf,
  isMediaUrl,
  MAX_MEDIA_FILES,
  mimeForExtension,
  productFieldsSchema,
  storyChapterSchema,
  variantInputSchema,
  type ProductFields,
  type StoryChapter,
  type VariantInput,
} from "./schema";
import { productSlug, slugify } from "./slug";

export const CATALOG_VERSION = 1;

// Shape of one product in the file. Business rules (category, price, slug) stay in
// inspectDraft so those mistakes appear as editable cells in the preview, while
// wrong types and unknown keys are reported against the file itself.
const jsonMediaSchema = z
  .object({
    file: z.string().trim().min(1).optional(),
    url: z.string().trim().refine(isMediaUrl, "Use an http(s) URL or a path starting with /.").optional(),
    alt: z.string().trim().max(300).optional(),
  })
  .strict()
  .refine((item) => Boolean(item.file) !== Boolean(item.url), "Set either file or url, not both.");

const jsonCollectibleSchema = z
  .object({
    // Only exports write this, for rows with an edition size but no collectible flag.
    isCollectible: z.boolean().optional(),
    editionSize: z.number().int("Edition size must be a whole number.").positive("Edition size must be greater than 0.").optional(),
    story: z.array(storyChapterSchema).max(50).optional(),
  })
  .strict();

const jsonProductSchema = z
  .object({
    title: z.string().default(""),
    category: z.string().default(""),
    price: z.union([z.number(), z.string()]).default(""),
    media: z.array(jsonMediaSchema).default([]),
    slug: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    weightGrams: z.number().int("Weight must be a whole number.").positive("Weight must be greater than 0.").optional(),
    character: z.string().optional(),
    series: z.string().optional(),
    collection: z.string().optional(),
    collectible: jsonCollectibleSchema.optional(),
    variants: z.array(variantInputSchema).min(1).max(100).optional(),
  })
  .strict();

export type CatalogProduct = z.input<typeof jsonProductSchema>;

const catalogFileSchema = z
  .object({
    version: z.literal(CATALOG_VERSION, { error: `version must be ${CATALOG_VERSION}.` }),
    exportedAt: z.string().optional(),
    products: z.array(z.unknown(), { error: "products must be an array." }),
  })
  .strict();

// One example per category. Size and format differences live in variants[].attributes.
const TEMPLATE_PRODUCTS: CatalogProduct[] = [
  {
    title: "Wooden Train Set",
    category: "toys",
    price: 49,
    slug: "wooden-train-set",
    description: "Handmade wooden train with 24 track pieces.",
    weightGrams: 1200,
    collection: "classics",
    media: [{ file: "train-1.webp", alt: "Train on its track" }, { file: "train-2.webp" }],
  },
  {
    title: "Fantasia Blind Box",
    category: "collectible_toys",
    price: 16.99,
    slug: "molly-fantasia-blind-box",
    description: "Vol.8 blind box.",
    status: "active",
    weightGrams: 180,
    character: "Molly",
    series: "Vol.8",
    collection: "fantasia",
    collectible: {
      editionSize: 500,
      story: [{ title: "The Den", body: "Molly finds the door behind the stage.", image: "https://example.com/molly-den.webp" }],
    },
    media: [{ file: "molly-1.webp", alt: "Front of the box" }, { url: "https://example.com/molly-2.webp" }, { file: "teaser.mp4" }],
    variants: [
      { sku: "MOLLY-BOX-STD", attributes: { edition: "standard" }, stock: 25 },
      { sku: "MOLLY-BOX-GOLD", attributes: { edition: "gold" }, price: 29.99, stock: 5 },
    ],
  },
  {
    title: "Forest Tales",
    category: "books",
    price: 18,
    slug: "forest-tales",
    description: "Short stories for kids, 96 pages.",
    weightGrams: 350,
    media: [{ file: "forest-tales.webp" }],
    variants: [
      { sku: "FOREST-TALES-SOFT", attributes: { format: "softcover" }, stock: 40 },
      { sku: "FOREST-TALES-HARD", attributes: { format: "hardcover" }, price: 26, stock: 15 },
    ],
  },
  {
    title: "Forest Worlds Artbook",
    category: "artbooks",
    price: 15,
    slug: "forest-worlds-artbook",
    description: "Environment paintings, 90 pages, PDF.",
    type: "digital",
    collection: "forest",
    media: [{ file: "forest-worlds.webp" }],
  },
  {
    title: "Lantern Poster Design",
    category: "designs",
    price: 9.5,
    slug: "lantern-poster-design",
    description: "Printable poster artwork.",
    type: "digital",
    status: "draft",
    media: [{ file: "lantern-poster.webp" }],
  },
  {
    title: "Fantasia Hoodie",
    category: "merch",
    price: 49.99,
    slug: "fantasia-hoodie",
    description: "Heavy cotton hoodie.",
    weightGrams: 600,
    character: "Molly",
    media: [{ file: "hoodie-front.webp" }, { file: "hoodie-back.webp" }],
    variants: [
      { sku: "FANTASIA-HOODIE-M", attributes: { size: "M", color: "black" }, stock: 12 },
      { sku: "FANTASIA-HOODIE-L", attributes: { size: "L", color: "black" }, stock: 8 },
    ],
  },
  {
    title: "Thor Resin Figure",
    category: "figures",
    price: 120,
    slug: "thor-resin-figure",
    description: "Hand-painted resin figure, 18 cm.",
    weightGrams: 500,
    character: "Thor",
    collectible: { editionSize: 100 },
    media: [{ file: "thor-figure.webp" }],
    variants: [{ sku: "THOR-FIGURE-STD", attributes: { material: "resin" }, stock: 100 }],
  },
];

export const CATALOG_TEMPLATE = `${JSON.stringify({ version: CATALOG_VERSION, products: TEMPLATE_PRODUCTS }, null, 2)}\n`;

export interface DraftMedia {
  file?: string;
  url?: string;
  alt?: string;
}

export interface DraftRow {
  id: string;
  title: string;
  category: string;
  price: string;
  description: string;
  media: DraftMedia[];
  productType: string;
  status: string;
  stock: string;
  character: string;
  series: string;
  collection: string;
  weightGrams?: number;
  editionSize: string;
  isCollectible: boolean;
  story?: StoryChapter[];
  variants?: VariantInput[];
  slug: string;
}

export interface DraftIssue {
  errors: Record<string, string>;
  missingFiles: string[];
  input?: ProductFields;
}

export function basename(name: string): string {
  return name.split(/[/\\]/).pop()?.toLowerCase() ?? name.toLowerCase();
}

export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (!base) return "Untitled";
  return base.replace(/\b\w/g, (char) => char.toUpperCase());
}

// `name-1.jpg` + `name-2.jpg` share `name`. A file without a trailing number stays alone.
export function filenamePrefix(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const match = base.match(/^(.*?)[-_](\d+)$/);
  return (match?.[1] || base).toLowerCase();
}

// Accepts `16.99`, `$16.99`, and `16,99`.
export function normalizePrice(raw: string): number | null {
  const cleaned = raw.trim().replace(/[$€£\s]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function issuePath(prefix: string, path: PropertyKey[]): string {
  return path.reduce<string>((text, key) => (typeof key === "number" ? `${text}[${key}]` : `${text}.${String(key)}`), prefix);
}

function stockTotal(variants: VariantInput[]): number {
  return variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export function parseCatalogJson(text: string): { rows: DraftRow[]; errors: string[] } {
  // Syntax and envelope problems stop here: there are no products to show.
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { rows: [], errors: [`Not valid JSON: ${err instanceof Error ? err.message : "parse error"}`] };
  }
  const file = catalogFileSchema.safeParse(raw);
  if (!file.success) {
    return { rows: [], errors: file.error.issues.map((issue) => `${issuePath("file", issue.path)}: ${issue.message}`) };
  }
  if (file.data.products.length === 0) return { rows: [], errors: ["The file has no products."] };

  const errors: string[] = [];
  const rows: DraftRow[] = [];
  const seenSlugs = new Set<string>();
  const seenSkus = new Set<string>();

  // Each product stands alone, so one bad entry does not reject the rest of the file.
  file.data.products.forEach((entry, index) => {
    const label = `products[${index}]`;
    const parsed = jsonProductSchema.safeParse(entry);
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((issue) => `${issuePath(label, issue.path)}: ${issue.message}`));
      return;
    }
    const product = parsed.data;
    const title = product.title.trim();
    const character = product.character?.trim() ?? "";
    const slug = slugify(product.slug ?? "") || productSlug(title, character);

    // Slugs and SKUs are unique in the database, so a repeat in the file cannot both import.
    if (slug && seenSlugs.has(slug)) {
      errors.push(`${label}: duplicate slug "${slug}" in this file.`);
      return;
    }
    const skus = (product.variants ?? []).flatMap((variant) => (variant.sku ? [variant.sku] : []));
    const repeatedSku = skus.find((sku, position) => seenSkus.has(sku) || skus.indexOf(sku) !== position);
    if (repeatedSku) {
      errors.push(`${label}: duplicate SKU "${repeatedSku}" in this file.`);
      return;
    }
    if (slug) seenSlugs.add(slug);
    for (const sku of skus) seenSkus.add(sku);

    rows.push({
      id: `json-${index + 1}`,
      title,
      category: product.category.trim(),
      price: String(product.price).trim(),
      description: product.description?.trim() ?? "",
      media: product.media,
      productType: product.type?.trim() || "physical",
      status: product.status?.trim() || "active",
      stock: product.variants ? String(stockTotal(product.variants)) : "",
      character,
      series: product.series?.trim() ?? "",
      collection: product.collection?.trim() ?? "",
      weightGrams: product.weightGrams,
      editionSize: product.collectible?.editionSize === undefined ? "" : String(product.collectible.editionSize),
      isCollectible: product.collectible ? (product.collectible.isCollectible ?? true) : false,
      story: product.collectible?.story,
      variants: product.variants,
      slug,
    });
  });

  return { rows, errors };
}

export function draftsFromFiles(files: File[], category: string, groupByPrefix: boolean): DraftRow[] {
  const images = files.filter((file) => mimeForExtension(file.name)?.startsWith("image/"));
  const groups = new Map<string, File[]>();
  if (groupByPrefix) {
    for (const file of images) {
      const key = filenamePrefix(file.name);
      groups.set(key, [...(groups.get(key) ?? []), file]);
    }
  } else {
    images.forEach((file, index) => groups.set(`${index}:${file.name}`, [file]));
  }

  return [...groups.entries()].map(([key, group], index) => {
    const title = titleFromFilename(groupByPrefix ? key : group[0]!.name);
    return {
      id: `quick-${index + 1}`,
      title,
      category,
      price: "",
      description: "",
      media: group.map((file) => ({ file: file.name })),
      productType: "physical",
      status: "active",
      stock: "",
      character: "",
      series: "",
      collection: "",
      editionSize: "",
      isCollectible: false,
      slug: productSlug(title),
    } satisfies DraftRow;
  });
}

export function fileIndex(files: File[]): Map<string, File> {
  const index = new Map<string, File>();
  for (const file of files) index.set(basename(file.name), file);
  return index;
}

export function inspectDraft(row: DraftRow, files: Map<string, File>): DraftIssue {
  const errors: Record<string, string> = {};

  // Media: URLs are checked when they download, named files must be attached now.
  const names = row.media.flatMap((item) => (item.file ? [item.file] : []));
  const missingFiles = names.filter((name) => !files.has(basename(name)));
  if (row.media.length === 0) errors.media = "Add at least one file.";
  else if (row.media.length > MAX_MEDIA_FILES) errors.media = `At most ${MAX_MEDIA_FILES} files.`;
  else if (missingFiles.length > 0) errors.media = `Missing file: ${missingFiles.join(", ")}`;

  const duplicateNames = names.filter((name, index) => files.has(basename(name)) && names.findIndex((other) => basename(other) === basename(name)) !== index);
  if (duplicateNames.length > 0 && !errors.media) errors.media = "Two files share the same name.";

  const price = normalizePrice(row.price);
  if (price === null) errors.price = "Enter a price like 16.99.";

  const productType = row.productType === "digital" ? "digital" : row.productType === "physical" ? "physical" : null;
  if (!productType) errors.productType = "Choose physical or digital.";

  const status = row.status === "draft" || row.status === "active" || row.status === "archived" ? row.status : null;
  if (!status) errors.status = "Choose active, draft, or archived.";

  // Stock: the cell edits a lone variant. Several variants keep their own counts.
  const severalVariants = (row.variants?.length ?? 0) > 1;
  const stockRaw = row.stock.trim();
  const stock = severalVariants ? stockTotal(row.variants!) : stockRaw === "" && productType ? defaultStock(productType) : Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or more.";
  const validStock = Number.isInteger(stock) && stock >= 0 ? stock : 0;
  const variants = row.variants?.length === 1 ? [{ ...row.variants[0]!, stock: validStock }] : row.variants;

  const editionRaw = row.editionSize.trim();
  const editionSize = editionRaw === "" ? undefined : Number(editionRaw);
  if (editionRaw !== "" && (!Number.isInteger(editionSize) || (editionSize ?? 0) <= 0)) {
    errors.editionSize = "Edition size must be a positive whole number.";
  }

  const parsed = productFieldsSchema.safeParse({
    title: row.title,
    category: row.category,
    description: row.description || undefined,
    price: price ?? 0,
    productType: productType ?? "physical",
    status: status ?? "active",
    stock: validStock,
    character: row.character || undefined,
    series: row.series || undefined,
    collection: row.collection || undefined,
    weightGrams: row.weightGrams,
    story: row.story,
    variants,
    editionSize: editionRaw === "" ? undefined : editionSize,
    isCollectible: row.isCollectible,
    slug: row.slug || productSlug(row.title, row.character),
  });

  if (!parsed.success) {
    for (const [key, message] of Object.entries(fieldErrorsOf(parsed.error))) {
      // Keep the clearer price message from normalizePrice.
      if (key === "price" && errors.price) continue;
      if (!errors[key]) errors[key] = message;
    }
  }

  const ok = Object.keys(errors).length === 0 && parsed.success;
  return { errors, missingFiles, input: ok ? parsed.data : undefined };
}

export function unmatchedFiles(rows: DraftRow[], files: File[]): string[] {
  const used = new Set(rows.flatMap((row) => row.media.flatMap((item) => (item.file ? [basename(item.file)] : []))));
  return files.map((file) => file.name).filter((name) => !used.has(basename(name)) && mimeForExtension(name));
}

export function errorReportJson(rows: { row: DraftRow; message: string }[]): string {
  return `${JSON.stringify(
    rows.map(({ row, message }) => ({ title: row.title, category: row.category, slug: row.slug, error: message })),
    null,
    2
  )}\n`;
}

// Last path segment of a media URL, without the query string.
function urlFileName(url: string): string {
  const segment = url.split(/[?#]/)[0]?.split("/").pop() ?? "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export function isVideoMedia(item: DraftMedia): boolean {
  const name = item.file ?? urlFileName(item.url ?? "");
  return mimeForExtension(name)?.startsWith("video/") ?? false;
}

// ponytail: downloads in the browser, so a host without CORS fails that row. Fetching on
// the server would be an open SSRF while ADMIN_PUBLIC is on; add it behind the role gate if needed.
export async function fetchMediaFile(url: string): Promise<File> {
  let blob: Blob;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    blob = await response.blob();
  } catch (err) {
    const reason = err instanceof Error ? err.message : "network error";
    throw new Error(`Could not download ${url} (${reason}). The host may block this; attach the file instead.`);
  }

  // The name decides the mime type later, so make sure it carries a known extension.
  const name = urlFileName(url) || "media";
  if (mimeForExtension(name)) return new File([blob], name, { type: blob.type });
  const extension = extensionForMime(blob.type.split(";")[0]?.trim() ?? "");
  if (!extension) throw new Error(`${url} is not a JPEG, PNG, WebP, AVIF, MP4, or WebM file.`);
  return new File([blob], `${name}.${extension}`, { type: blob.type });
}

export interface CatalogDbRow {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  product_type: string;
  collection: string | null;
  character: string | null;
  is_collectible: boolean;
  edition_size: number | null;
  series: string | null;
  images: unknown;
  base_price: number | string;
  weight_grams: number | null;
  collectible_story: unknown;
  status: string;
  product_variants: { sku: string; attributes: unknown; price: number | string | null; stock: number }[] | null;
}

// Drops null and undefined so an export only holds what the importer accepts.
function compact<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined)) as T;
}

// Seeded rows store images as plain strings and story chapters with `text` instead of `body`.
function mediaFromDb(images: unknown): DraftMedia[] {
  if (!Array.isArray(images)) return [];
  return images.flatMap((image: unknown) => {
    if (typeof image === "string") return [{ url: image }];
    const record = image as { url?: unknown; alt?: unknown } | null;
    if (typeof record?.url !== "string") return [];
    return [compact({ url: record.url, alt: typeof record.alt === "string" ? record.alt : undefined })];
  });
}

function storyFromDb(story: unknown): StoryChapter[] | undefined {
  if (!Array.isArray(story) || story.length === 0) return undefined;
  return story.map((chapter: { title?: string; body?: string; text?: string; image?: string }) => ({
    title: chapter.title ?? "",
    body: chapter.body ?? chapter.text ?? "",
    image: chapter.image ?? "",
  }));
}

function attributesFromDb(attributes: unknown): Record<string, string> | undefined {
  if (!attributes || typeof attributes !== "object") return undefined;
  return Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)]));
}

// Database row → the same structure the importer reads, so an export loads back.
export function productToJson(row: CatalogDbRow): CatalogProduct {
  const story = storyFromDb(row.collectible_story);
  const hasCollectible = row.is_collectible || row.edition_size !== null || story !== undefined;
  const variants = (row.product_variants ?? []).map((variant) =>
    compact({
      sku: variant.sku,
      attributes: attributesFromDb(variant.attributes),
      price: variant.price === null ? undefined : Number(variant.price),
      stock: variant.stock,
    })
  );
  return compact({
    title: row.title,
    category: row.category,
    price: Number(row.base_price),
    media: mediaFromDb(row.images),
    slug: row.slug,
    description: row.description,
    type: row.product_type,
    status: row.status,
    weightGrams: row.weight_grams,
    character: row.character,
    series: row.series,
    collection: row.collection,
    collectible: hasCollectible
      ? compact({
          isCollectible: row.is_collectible ? undefined : false,
          editionSize: row.edition_size,
          story,
        })
      : undefined,
    variants: variants.length > 0 ? variants : undefined,
  } as CatalogProduct);
}

export function downloadTextFile(filename: string, contents: string, type = "application/json;charset=utf-8"): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
