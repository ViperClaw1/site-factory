import { LegalNotice } from "@/components/LegalNotice";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/terms", { title: "Terms of Use" });

export default function TermsPage() {
  return <LegalNotice titleKey="legal.terms.title" />;
}
