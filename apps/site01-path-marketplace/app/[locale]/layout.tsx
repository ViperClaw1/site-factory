import { LOCALES, isLang, type Lang } from "@repo/i18n";
import { notFound } from "next/navigation";
import { RootDocument, baseMetadata } from "@/components/RootDocument";

export const metadata = baseMetadata;

// Top-level pages are built once per language. Detail pages return no params of
// their own, so they render on first request and stay cached by ISR.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale: locale.code }));
}

export default function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: Lang } }) {
  if (!isLang(params.locale)) notFound();
  return <RootDocument lang={params.locale}>{children}</RootDocument>;
}
