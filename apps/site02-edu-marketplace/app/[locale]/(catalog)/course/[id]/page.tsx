import { getCourse } from "@/features/catalog/api/courses";
import { CoursePage } from "@/features/course/components/CoursePage";
import { generateMetadata as seo } from "@repo/lib";
import { notFound } from "next/navigation";

export const revalidate = 60;

// `id` is the course slug (e.g. /course/python).
export async function generateMetadata({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);
  if (!course) return seo("Course", "Course not found");
  return seo(course.title, course.description ?? "", course.cover_image ?? undefined);
}

export default async function CourseByIdPage({ params }: { params: { id: string } }) {
  const course = await getCourse(params.id);
  if (!course) notFound();
  return <CoursePage course={course} />;
}
