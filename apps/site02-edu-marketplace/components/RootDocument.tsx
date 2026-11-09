import { isRtl, localeTag, type Lang } from "@repo/i18n";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { DEFAULT_THEME } from "@/lib/theme/theme";
import "@/app/globals.css";

const body = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

const heading = Manrope({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const baseMetadata: Metadata = {
  // Resolves relative OG/canonical URLs to absolute ones.
  metadataBase: process.env.BASE_URL ? new URL(process.env.BASE_URL) : undefined,
  title: "Path.courses — online IT school",
  description: "Interactive courses in programming, data, design and AI with mentors and hands-on practice.",
  // Demo: drop this when the site is meant to be indexed.
  robots: { index: false, follow: false },
};

// Reading the theme cookie on the server would make every page dynamic and
// switch ISR off, so the saved theme is applied before first paint instead.
const APPLY_SAVED_THEME = `try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]}catch(e){}`;

// The <html> shell shared by the two root layouts: [locale] and admin.
export function RootDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html
      lang={localeTag(lang)}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      data-theme={DEFAULT_THEME}
      className={`${body.variable} ${heading.variable}`}
      // APPLY_SAVED_THEME may change data-theme before React hydrates.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPLY_SAVED_THEME }} />
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost"}
          customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL}
          selfHosted
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <LanguageProvider lang={lang}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
