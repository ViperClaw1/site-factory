import { ComingSoon } from "@/components/ComingSoon";
import { alternates, type Lang } from "@repo/i18n";

export function generateMetadata({ params }: { params: { locale: Lang; courseSlug: string; lesson?: string[] } }) {
  return { alternates: alternates(`/learn/${[params.courseSlug, ...(params.lesson ?? [])].join("/")}`, params.locale) };
}

export default function LearnPage() {
  return (
    <ComingSoon
      title="Плеер"
      description="Видео, аудио и текстовые уроки откроются после оплаты — фаза E4."
    />
  );
}
