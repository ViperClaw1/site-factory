import { CATEGORIES } from "../catalog-taxonomy.mjs";
import { z } from "zod";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 200 * 1024 * 1024;
// Posters are extra signed uploads alongside each video, so the sign request
// allows media (20) plus one poster per video.
export const MAX_MEDIA_FILES = 20;
export const MAX_SIGN_FILES = 40;

// The hosted project rejected a 200 MiB bucket limit (50 MiB is the current cap).
export const STORAGE_PROJECT_LIMIT_BYTES = 50 * 1024 * 1024;

const CATEGORY_VALUES = CATEGORIES as unknown as [(typeof CATEGORIES)[number], ...(typeof CATEGORIES)[number][]];

export const categorySchema = z.enum(CATEGORY_VALUES, { error: "Choose a category." });

const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const priceSchema = z
  .number({ error: "Enter a price in USD." })
  .gt(0, "Price must be greater than 0.")
  .lte(100000, "Price must be at most 100000.")
  .refine(twoDecimals, "Use at most 2 decimal places.");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const productFieldsSchema = z.object({
  title: z.string().trim().min(2, "Title must be 2–120 characters.").max(120, "Title must be 2–120 characters."),
  category: categorySchema,
  description: z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters.")
    .optional()
    .transform((value) => value?.trim() || undefined),
  price: priceSchema,
  productType: z.enum(["physical", "digital"]).default("physical"),
  status: z.enum(["active", "draft"]).default("active"),
  stock: z.number().int("Stock must be a whole number.").min(0, "Stock must be 0 or more."),
  character: optionalText(120),
  series: optionalText(120),
  editionSize: z
    .number()
    .int("Edition size must be a whole number.")
    .positive("Edition size must be greater than 0.")
    .optional(),
  isCollectible: z.boolean().optional().default(false),
  slug: slugSchema,
});

export const storedMediaSchema = z.object({
  path: z.string().min(1),
  type: z.enum(["image", "video"]),
  alt: z.string().trim().max(300).optional(),
  posterPath: z.string().min(1).optional(),
});

export const productInputSchema = productFieldsSchema.extend({
  media: z.array(storedMediaSchema).min(1, "Add at least one file.").max(MAX_MEDIA_FILES, "At most 20 files."),
});

export const signFileSchema = z.object({
  name: z.string().min(1).max(300),
  size: z.number().int().positive(),
  mime: z.enum(ALLOWED_MIME_TYPES, { error: "Use JPEG, PNG, WebP, AVIF, MP4, or WebM." }),
  role: z.enum(["media", "poster"]),
});

export const signRequestSchema = z.object({
  category: categorySchema,
  slug: z.string().trim().max(160).optional(),
  title: z.string().trim().min(2).max(120),
  character: optionalText(120),
  files: z.array(signFileSchema).min(1).max(MAX_SIGN_FILES),
});

export type ProductFields = z.infer<typeof productFieldsSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type SignRequest = z.infer<typeof signRequestSchema>;

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function mimeForExtension(name: string): (typeof ALLOWED_MIME_TYPES)[number] | null {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "avif":
      return "image/avif";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    default:
      return null;
  }
}

export function extensionForMime(mime: string): string | null {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    default:
      return null;
  }
}

export function defaultStock(productType: "physical" | "digital"): number {
  return productType === "digital" ? 9999 : 25;
}
