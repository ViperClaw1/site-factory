import { getCourse } from "@/features/catalog/api/courses";
import { CoursePage } from "@/features/course/components/CoursePage";
import { generateMetadata as seo } from "@repo/lib";
import { notFound } from "next/navigation";
import { alternates, type Lang } from "@repo/i18n";

export const revalidate = 60;

// Empty on purpose: nothing is built ahead of time, and each page in each language
// is cached by ISR on its first request. Without this export Next renders it every time.
export function generateStaticParams() {
  return [];
}

// `id` is the course slug (e.g. /course/python).
export async function generateMetadata({ params }: { params: { locale: Lang; id: string } }) {
  const links = alternates(`/course/${params.id}`, params.locale);
  const course = await getCourse(params.id);
  if (!course) return { ...seo("Course", "Course not found"), alternates: links };
  return { ...seo(course.title, course.description ?? "", course.cover_image ?? undefined), alternates: links };
}

export default async function CourseByIdPage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);
  if (!course) notFound();
  return <CoursePage course={course} />;
}
