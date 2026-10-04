import type { MetadataRoute } from "next";
import { getCourses } from "@/features/catalog/api/courses";

// Otherwise built once at build time and frozen until the next deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Demo: advertise nothing. Delete this return when the site is public.
  return [];

  const base = process.env.BASE_URL ?? "http://localhost:3002";

  const courses = await getCourses();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/courses`, changeFrequency: "daily", priority: 0.9 },
  ];

  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${base}/courses/${course.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...courseRoutes];
}
