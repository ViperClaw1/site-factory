import { BADGES, CATEGORIES, CURRENCIES, INSTRUCTORS, LEVELS, LOCALES } from "@/lib/admin/catalog";
import { z } from "zod";

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;

const CATEGORY_VALUES = CATEGORIES as unknown as [(typeof CATEGORIES)[number], ...(typeof CATEGORIES)[number][]];
const LEVEL_VALUES = LEVELS as unknown as [(typeof LEVELS)[number], ...(typeof LEVELS)[number][]];
const CURRENCY_VALUES = CURRENCIES as unknown as [(typeof CURRENCIES)[number], ...(typeof CURRENCIES)[number][]];
const BADGE_VALUES = BADGES as unknown as [(typeof BADGES)[number], ...(typeof BADGES)[number][]];
const LOCALE_VALUES = LOCALES.map((locale) => locale.code) as [string, ...string[]];
const INSTRUCTOR_VALUES = INSTRUCTORS.map((person) => person.id) as [string, ...string[]];

const twoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const priceSchema = z
  .number({ error: "Enter a price." })
  .gt(0, "Price must be greater than 0.")
  .lte(100000, "Price must be at most 100000.")
  .refine(twoDecimals, "Use at most 2 decimal places.");

const copySchema = z.object({
  title: z.string().trim().max(120).optional().default(""),
  subtitle: z.string().trim().max(160).optional().default(""),
  description: z.string().trim().max(5000).optional().default(""),
});

export const courseInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
    translations: z.partialRecord(z.enum(LOCALE_VALUES), copySchema),
    category: z.enum(CATEGORY_VALUES, { error: "Choose a category." }),
    level: z.enum(LEVEL_VALUES, { error: "Choose a level." }),
    tags: z.array(z.string().trim().min(1).max(40)).max(12, "At most 12 tags."),
    coverPath: z.string().min(1, "Add a cover image."),
    promoVideoUrl: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => !value || /^https?:\/\//.test(value), "Promo video must be an http(s) URL."),
    price: priceSchema,
    currency: z.enum(CURRENCY_VALUES, { error: "Choose a currency." }),
    instructorId: z.enum(INSTRUCTOR_VALUES, { error: "Choose an instructor." }),
    durationMinutes: z.number().int("Duration must be whole minutes.").positive("Duration must be greater than 0."),
    badge: z.enum(BADGE_VALUES).nullable().optional().default(null),
    status: z.enum(["active", "draft"]).default("active"),
  })
  .superRefine((value, ctx) => {
    const filled = Object.values(value.translations).some((copy) => (copy?.title.trim().length ?? 0) >= 2);
    if (!filled) {
      ctx.addIssue({ code: "custom", path: ["translations"], message: "Add a title (at least 2 characters) for one language." });
    }
  });

export const signRequestSchema = z.object({
  title: z.string().trim().min(2).max(120),
  file: z.object({
    name: z.string().min(1).max(300),
    size: z.number().int().positive().max(IMAGE_MAX_BYTES, "Cover must be 15 MB or smaller."),
    mime: z.enum(IMAGE_MIME_TYPES, { error: "Use JPEG, PNG, WebP, or AVIF." }),
  }),
});

export type CourseInput = z.infer<typeof courseInputSchema>;
export type SignRequest = z.infer<typeof signRequestSchema>;

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function mimeForExtension(name: string): (typeof IMAGE_MIME_TYPES)[number] | null {
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
    default:
      return null;
  }
}

export function extensionForMime(mime: (typeof IMAGE_MIME_TYPES)[number]): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "avif";
}
