import { CoursesShowcase } from "@/features/landing/components/CoursesShowcase";
import { getCourses } from "@/features/catalog/api/courses";
import { generateMetadata as seo } from "@repo/lib";

export const revalidate = 60;

export function generateMetadata() {
  return seo("Каталог курсов", "Все курсы платформы: видео, аудио и текст.");
}

// Same cards + filters as the home page showcase.
export default async function CoursesPage() {
  const courses = await getCourses({ sort: "newest" });
  return <CoursesShowcase courses={courses} />;
}
