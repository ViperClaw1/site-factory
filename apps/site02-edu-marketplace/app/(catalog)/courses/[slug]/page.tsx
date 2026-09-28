import { getCourse } from "@/features/catalog/api/courses";
import { CourseDetail } from "@/features/course/components/CourseDetail";
import { generateCourseJsonLd, generateMetadata as seo } from "@repo/lib";
import { notFound } from "next/navigation";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await getCourse(params.slug);
  if (!course) {
    return seo("Курс", "Курс не найден");
  }
  return seo(course.title, (course.description ?? course.subtitle ?? "").slice(0, 160), course.cover_image ?? undefined);
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
