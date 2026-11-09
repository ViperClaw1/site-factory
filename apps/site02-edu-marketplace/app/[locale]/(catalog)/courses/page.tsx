import { CoursesShowcase } from "@/features/landing/components/CoursesShowcase";
import { getCourses } from "@/features/catalog/api/courses";
import { generateMetadata as seo } from "@repo/lib";
import { alternates, type Lang } from "@repo/i18n";

export const revalidate = 60;

export function generateMetadata({ params }: { params: { locale: Lang } }) {
  return { ...seo("Каталог курсов", "Все курсы платформы: видео, аудио и текст."), alternates: alternates("/courses", params.locale) };
}

// Same cards + filters as the home page showcase.
export default async function CoursesPage() {
  const courses = await getCourses({ sort: "newest" });
  return <CoursesShowcase courses={courses} />;
}
