import type { MetadataRoute } from "next";
import { getCourses } from "@/features/catalog/api/courses";
import { SECTIONS } from "@/features/landing/data";
import { sitemapEntries } from "@repo/i18n";

// Otherwise built once at build time and frozen until the next deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Demo: advertise nothing. Delete this return when the site is public.
  return [];

  const base = process.env.BASE_URL ?? "http://localhost:3002";

  const courses = await getCourses();

  return [
    ...sitemapEntries(base, "/", { changeFrequency: "daily", priority: 1 }),
    ...sitemapEntries(base, "/courses", { changeFrequency: "daily", priority: 0.9 }),
    ...SECTIONS.flatMap((section) =>
      sitemapEntries(base, `/courses/s/${section}`, { changeFrequency: "daily", priority: 0.85 }),
    ),
    ...courses.flatMap((course) =>
      sitemapEntries(base, `/courses/${course.slug}`, { changeFrequency: "weekly", priority: 0.8 }),
    ),
  ];
}
