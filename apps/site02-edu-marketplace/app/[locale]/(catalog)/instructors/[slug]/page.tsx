import { ComingSoon } from "@/components/ComingSoon";
import { alternates, type Lang } from "@repo/i18n";

export function generateMetadata({ params }: { params: { locale: Lang; slug: string } }) {
  return { alternates: alternates(`/instructors/${params.slug}`, params.locale) };
}

export default function InstructorPage() {
  return (
    <ComingSoon
      title="Преподаватель"
      description="Страница преподавателя появится в следующих фазах. Биографии живут в Directus."
    />
  );
}
