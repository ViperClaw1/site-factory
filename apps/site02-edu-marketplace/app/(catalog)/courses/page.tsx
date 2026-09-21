import { CourseCard } from "@/features/catalog/components/CourseCard";
import { getCourses } from "@/features/catalog/api/courses";
import { generateMetadata as seo } from "@repo/lib";
import { Container, Section } from "@repo/ui";

export const revalidate = 0;

export function generateMetadata() {
  return seo("Каталог курсов", "Все курсы платформы: видео, аудио и текст.");
}

export default async function CoursesPage() {
  const courses = await getCourses({ sort: "newest" });

  return (
    <Section>
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">Каталог</p>
        <h1 className="mt-4 font-heading text-4xl italic">Все курсы</h1>
        {courses.length === 0 ? (
          <p className="mt-8 text-[var(--color-text)]/60">Пока нет опубликованных курсов.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
