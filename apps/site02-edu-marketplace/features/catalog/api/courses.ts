import "server-only";

import { createSupabasePublicClient } from "@repo/lib";
import type { Course, CourseModule, CourseWithCurriculum, LessonOutline } from "@repo/types";
import { FETCH_TIMEOUT_MS } from "@/lib/with-timeout";

export type { Course, CourseWithCurriculum } from "@repo/types";

export interface CourseFilters {
  category?: string;
  level?: string;
  sort?: "newest" | "price_asc" | "price_desc";
}

export async function getCourses(filters: CourseFilters = {}): Promise<Course[]> {
  try {
    const supabase = createSupabasePublicClient();
    let query = supabase.from("courses").select("*").eq("status", "active");

    if (filters.category) query = query.eq("category", filters.category);
    if (filters.level) query = query.eq("level", filters.level);

    switch (filters.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query.abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS));
    if (error) {
      console.error("getCourses failed", error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.error("getCourses threw", error);
    return [];
  }
}

type CourseRow = Course & {
  course_modules: (CourseModule & { lessons: LessonOutline[] })[] | null;
};

export async function getCourse(slug: string): Promise<CourseWithCurriculum | null> {
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(
        `
        *,
        course_modules (
          id, course_id, title, description, sort, is_preview,
          lessons ( id, module_id, slug, title, type, duration_seconds, sort, is_preview )
        )
      `
      )
      .eq("slug", slug)
      .eq("status", "active")
      .order("sort", { referencedTable: "course_modules", ascending: true })
      .order("sort", { referencedTable: "course_modules.lessons", ascending: true })
      .abortSignal(AbortSignal.timeout(FETCH_TIMEOUT_MS))
      .maybeSingle();

    if (error) {
      console.error("getCourse failed", error);
      return null;
    }
    if (!data) return null;

    const row = data as CourseRow;
    const { course_modules: modules, ...course } = row;
    return {
      ...course,
      modules: modules ?? [],
    };
  } catch (error) {
    console.error("getCourse threw", error);
    return null;
  }
}
