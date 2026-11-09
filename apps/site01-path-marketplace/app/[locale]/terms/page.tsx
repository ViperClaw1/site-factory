import { LegalNotice } from "@/components/LegalNotice";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return <LegalNotice titleKey="legal.terms.title" />;
}
