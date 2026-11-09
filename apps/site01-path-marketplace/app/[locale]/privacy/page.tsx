import { LegalNotice } from "@/components/LegalNotice";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/privacy", { title: "Privacy Policy" });

export default function PrivacyPage() {
  return <LegalNotice titleKey="legal.privacy.title" />;
}
