import { CoursePage } from "@/features/course/components/CoursePage";
import { findStaticCourse } from "@/features/course/static-catalog";
import { generateMetadata as seo } from "@repo/lib";
import { notFound } from "next/navigation";

export function generateMetadata({ params }: { params: { id: string } }) {
  const course = findStaticCourse(params.id);
  if (!course) return seo("Course", "Course not found");
  return seo(course.title, course.summary, course.photo);
}

export default function CourseByIdPage({ params }: { params: { id: string } }) {
  const course = findStaticCourse(params.id);
  if (!course) notFound();
  return <CoursePage course={course} />;
}
