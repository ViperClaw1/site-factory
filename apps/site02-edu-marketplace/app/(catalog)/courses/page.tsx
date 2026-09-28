import { CourseCatalog } from "@/features/catalog/components/CourseCatalog";
import { getCourses } from "@/features/catalog/api/courses";
import { generateMetadata as seo } from "@repo/lib";

export const revalidate = 60;

export function generateMetadata() {
  return seo("Каталог курсов", "Все курсы платформы: видео, аудио и текст.");
}

export default async function CoursesPage() {
  const courses = await getCourses({ sort: "newest" });
  return <CourseCatalog courses={courses} />;
}
