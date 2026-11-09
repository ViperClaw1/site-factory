import { ComingSoon } from "@/components/ComingSoon";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/account/courses");

export default function AccountCoursesPage() {
  return (
    <ComingSoon title="Мои курсы" description="Список купленных курсов появится после Auth и enrollments." />
  );
}
