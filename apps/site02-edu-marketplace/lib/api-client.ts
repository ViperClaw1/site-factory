/**
 * Shared public reads. Feature-specific fetchers live under features/*/api.
 * This file is the page-level mix point (Directus + Supabase) as later phases land.
 */
export { getCourse, getCourses } from "@/features/catalog/api/courses";
