import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { cookies } from "next/headers";
import PlausibleProvider from "next-plausible";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { DEFAULT_LANG, LANG_COOKIE, isLang } from "@/lib/i18n/locales";
import "./globals.css";

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

const heading = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  // Resolves relative OG/canonical URLs to absolute ones.
  metadataBase: process.env.BASE_URL ? new URL(process.env.BASE_URL) : undefined,
  title: "Path.courses — online IT school",
  description: "Interactive courses in programming, data, design and AI with mentors and hands-on practice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Language lives in a cookie so SSR output already matches the visitor's choice.
  const saved = cookies().get(LANG_COOKIE)?.value;
  const lang = isLang(saved) ? saved : DEFAULT_LANG;

  return (
    <html lang={lang} className={`${body.variable} ${heading.variable}`}>
      <head>
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost"}
          customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL}
          selfHosted
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <LanguageProvider initialLang={lang} hasSavedLang={isLang(saved)}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
