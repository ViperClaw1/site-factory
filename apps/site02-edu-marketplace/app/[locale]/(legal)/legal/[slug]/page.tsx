"use client";

import { ComingSoon } from "@/components/ComingSoon";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const copy = {
  en: {
    soon: "Coming soon",
    privacy: "Privacy",
    terms: "Terms",
    description: "Legal texts will be published here.",
  },
  ru: {
    soon: "Скоро",
    privacy: "Конфиденциальность",
    terms: "Оферта",
    description: "Юридические тексты будут в Directus.",
  },
} as const;

export default function LegalPage({ params }: { params: { slug: string } }) {
  const { lang } = useI18n();
  const text = lang === "ru" ? copy.ru : copy.en;

  return (
    <ComingSoon
      eyebrow={text.soon}
      title={params.slug === "terms" ? text.terms : text.privacy}
      description={text.description}
    />
  );
}
