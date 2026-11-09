import { getCourse } from "@/features/catalog/api/courses";
import { CourseDetail } from "@/features/course/components/CourseDetail";
import { generateCourseJsonLd, generateMetadata as seo } from "@repo/lib";
import { notFound } from "next/navigation";
import { alternates, type Lang } from "@repo/i18n";

export const revalidate = 60;

// Empty on purpose: nothing is built ahead of time, and each page in each language
// is cached by ISR on its first request. Without this export Next renders it every time.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { locale: Lang; slug: string } }) {
  const links = alternates(`/courses/${params.slug}`, params.locale);
  const course = await getCourse(params.slug);
  if (!course) {
    return { ...seo("Курс", "Курс не найден"), alternates: links };
  }
  return {
    ...seo(course.title, (course.description ?? course.subtitle ?? "").slice(0, 160), course.cover_image ?? undefined),
    alternates: links,
  };
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) notFound();

  const jsonLd = generateCourseJsonLd(course, `${process.env.BASE_URL ?? ""}/courses/${course.slug}`);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <CourseDetail course={course} />
    </>
  );
}
