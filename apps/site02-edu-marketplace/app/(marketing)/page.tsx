import { CourseCard } from "@/features/catalog/components/CourseCard";
import { getCourses } from "@/features/catalog/api/courses";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { Container, Section } from "@repo/ui";

export const revalidate = 0;

export default async function HomePage() {
  const courses = await getCourses({ sort: "newest" });

  return (
    <>
      <LandingHero />
      <Section id="catalog">
        <Container>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">07 / Каталог</p>
          <h2 className="mt-4 font-heading text-4xl italic">Курсы</h2>
          {courses.length === 0 ? (
            <p className="mt-6 text-[var(--color-text)]/60">
              Каталог пуст — выполните миграции и seed в Supabase или проверьте переменные окружения.
            </p>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
