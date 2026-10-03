import Papa from "papaparse";
import {
  defaultStock,
  fieldErrorsOf,
  mimeForExtension,
  productFieldsSchema,
  type ProductFields,
} from "./schema";
import { productSlug, slugify } from "./slug";

export const CSV_TEMPLATE = `title,category,price,description,media,product_type,status,stock,character,series,edition_size,is_collectible,slug
Fantasia Blind Box,collectible_toys,16.99,"Vol.8 blind box",molly-1.webp;molly-2.webp;teaser.mp4,physical,active,25,Molly,Vol.8,,true,
`;

const REQUIRED_HEADERS = ["title", "category", "price", "media"] as const;

export interface DraftRow {
  id: string;
  title: string;
  category: string;
  price: string;
  description: string;
  media: string[];
  productType: string;
  status: string;
  stock: string;
  character: string;
  series: string;
  editionSize: string;
  isCollectible: boolean;
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

function flag(raw: string | undefined): boolean {
  return ["true", "1", "yes"].includes((raw ?? "").trim().toLowerCase());
}

function blank(value: string | undefined): string {
  return (value ?? "").trim();
}

export function parseCatalogCsv(text: string): { rows: DraftRow[]; errors: string[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  const errors = parsed.errors.map((issue) => issue.message).filter(Boolean);
  const fields = parsed.meta.fields ?? [];
  if (fields.length === 0) {
    return { rows: [], errors: ["CSV needs a header row."] };
  }
  const missing = REQUIRED_HEADERS.filter((header) => !fields.includes(header));
  if (missing.length > 0) {
    errors.push(`Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`);
  }

  const rows = parsed.data.map((record, index) => {
    const media = blank(record.media)
      .split(";")
      .map((name) => name.trim())
      .filter(Boolean);
    const title = blank(record.title);
    const character = blank(record.character);
    const slugRaw = blank(record.slug);
    return {
      id: `csv-${index + 1}`,
      title,
      category: blank(record.category),
      price: blank(record.price),
      description: blank(record.description),
      media,
      productType: blank(record.product_type) || "physical",
      status: blank(record.status) || "active",
      stock: blank(record.stock),
      character,
      series: blank(record.series),
      editionSize: blank(record.edition_size),
      isCollectible: flag(record.is_collectible),
      slug: slugify(slugRaw) || productSlug(title, character),
    } satisfies DraftRow;
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
      media: group.map((file) => file.name),
      productType: "physical",
      status: "active",
      stock: "",
      character: "",
      series: "",
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
  const missingFiles = row.media.filter((name) => !files.has(basename(name)));
  if (row.media.length === 0) errors.media = "Add at least one file.";
  else if (missingFiles.length > 0) errors.media = `Missing file: ${missingFiles.join(", ")}`;

  const duplicateNames = row.media.filter((name, index) => files.has(basename(name)) && row.media.findIndex((other) => basename(other) === basename(name)) !== index);
  if (duplicateNames.length > 0 && !errors.media) errors.media = "Two files share the same name.";

  const price = normalizePrice(row.price);
  if (price === null) errors.price = "Enter a price like 16.99.";

  const productType = row.productType === "digital" ? "digital" : row.productType === "physical" ? "physical" : null;
  if (!productType) errors.productType = "Choose physical or digital.";

  const status = row.status === "draft" ? "draft" : row.status === "active" ? "active" : null;
  if (!status) errors.status = "Choose active or draft.";

  const stockRaw = row.stock.trim();
  const stock = stockRaw === "" && productType ? defaultStock(productType) : Number(stockRaw);
  if (!Number.isInteger(stock) || stock < 0) errors.stock = "Stock must be a whole number, 0 or more.";

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
    stock: Number.isInteger(stock) && stock >= 0 ? stock : 0,
    character: row.character || undefined,
    series: row.series || undefined,
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
  const used = new Set(rows.flatMap((row) => row.media.map(basename)));
  return files.map((file) => file.name).filter((name) => !used.has(basename(name)) && mimeForExtension(name));
}

export function errorReportCsv(rows: { row: DraftRow; message: string }[]): string {
  return Papa.unparse(
    rows.map(({ row, message }) => ({
      title: row.title,
      category: row.category,
      price: row.price,
      media: row.media.join(";"),
      slug: row.slug,
      error: message,
    }))
  );
}

export function downloadTextFile(filename: string, contents: string, type = "text/csv;charset=utf-8"): void {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
