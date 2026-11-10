import { notFound } from "next/navigation";
import { getCourses } from "@/features/catalog/api/courses";
import { CoursesShowcase } from "@/features/landing/components/CoursesShowcase";
import { SECTIONS, isSectionId } from "@/features/landing/data";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { generateMetadata as seo } from "@repo/lib";
import { alternates, type Lang } from "@repo/i18n";

export const revalidate = 60;

type Params = { locale: Lang; section: string };

/* ---- One page per education-level section; unknown ids 404 ---- */
export function generateStaticParams() {
  return SECTIONS.map((section) => ({ section }));
}

export function generateMetadata({ params }: { params: Params }) {
  const links = alternates(`/courses/s/${params.section}`, params.locale);
  if (!isSectionId(params.section)) return { alternates: links };
  const t = (dictionaries as Record<string, (typeof dictionaries)[keyof typeof dictionaries]>)[params.locale] ?? dictionaries.en;
  return {
    ...seo(t.courses.sections[params.section], t.courses.sectionBlurbs[params.section]),
    alternates: links,
  };
}

export default async function SectionPage({ params }: { params: Params }) {
  if (!isSectionId(params.section)) notFound();
  const courses = await getCourses({ section: params.section, sort: "newest" });
  return <CoursesShowcase courses={courses} fixedSection={params.section} />;
}
