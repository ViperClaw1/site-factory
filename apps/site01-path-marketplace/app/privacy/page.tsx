import { LegalNotice } from "@/components/LegalNotice";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return <LegalNotice titleKey="legal.privacy.title" />;
}
