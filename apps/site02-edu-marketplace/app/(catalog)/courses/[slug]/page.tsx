import { getCourse } from "@/features/catalog/api/courses";
import { formatPrice, generateCourseJsonLd, generateMetadata as seo } from "@repo/lib";
import { Button, Container, Section } from "@repo/ui";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    <Section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <Container>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)]">
          {course.level ?? "курс"}
        </p>
        <h1 className="mt-4 font-heading text-5xl italic">{course.title}</h1>
        {course.subtitle && <p className="mt-4 max-w-2xl text-lg text-[var(--color-text)]/70">{course.subtitle}</p>}
        <p className="mt-6 text-xl">{formatPrice(course.price, course.currency)}</p>
        <Link href="/cart" className="mt-6 inline-block">
          <Button disabled>В корзину — E3</Button>
        </Link>
        <ol className="mt-16 space-y-8">
          {course.modules.map((module, index) => (
            <li key={module.id}>
              <h2 className="font-heading text-2xl italic">
                {String(index + 1).padStart(2, "0")}. {module.title}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--color-text)]/70">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    {lesson.title}
                    <span className="ml-2 uppercase tracking-wide text-[var(--color-primary)]">
                      {lesson.type}
                      {lesson.is_preview ? " · preview" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
