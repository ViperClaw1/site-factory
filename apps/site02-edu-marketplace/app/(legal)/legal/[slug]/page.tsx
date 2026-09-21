import { ComingSoon } from "@/components/ComingSoon";

export default function LegalPage({ params }: { params: { slug: string } }) {
  return (
    <ComingSoon
      title={params.slug === "terms" ? "Оферта" : "Конфиденциальность"}
      description="Юридические тексты будут в Directus (страницы legal)."
    />
  );
}
