import { isRtl, localeTag, type Lang } from "@repo/i18n";
import type { Metadata } from "next";
import { Alegreya, Fraunces, Onest, Outfit } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import "@/app/globals.css";

// Outfit for body copy, Fraunces (variable, with its SOFT/WONK axes) for the
// heavy display headlines.
// No bundled system fallback on the Latin faces (fallback: [],
// adjustFontFallback: false): next/font otherwise appends a metric-matched
// Arial/Times face to the variable, and since those contain Cyrillic, they'd
// catch Russian text before the Cyrillic faces below (the old bug: Cyrillic
// headings rendered in Times New Roman). Cost: no metric-matched stand-in
// while these load (display: swap) — a slight reflow on first paint.
const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  fallback: [],
  adjustFontFallback: false,
});

const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
  fallback: [],
  adjustFontFallback: false,
});

// Cyrillic faces for the ru locale — Outfit and Fraunces ship no Cyrillic
// glyphs, so Cyrillic falls through to these (listed right after them in
// globals.css). Onest matches Outfit's geometry; Alegreya 900 matches Fraunces
// Black's weight, width and soft serifs. They must stay AFTER the Latin faces:
// next/font's `subsets` only limits preloading, the CSS still carries their
// Latin glyphs too. preload: false plus the class below keeps them off every
// other language's pages; CJK, Arabic, Hindi, Thai and Amharic use system fonts.
const bodyCyrillic = Onest({
  subsets: ["cyrillic"],
  variable: "--font-body-cyrillic",
  display: "swap",
  preload: false,
});

const headingCyrillic = Alegreya({
  subsets: ["cyrillic"],
  weight: "900",
  variable: "--font-heading-cyrillic",
  display: "swap",
  preload: false,
});

export const baseMetadata: Metadata = {
  // Resolves relative OG/canonical URLs to absolute ones.
  metadataBase: process.env.BASE_URL ? new URL(process.env.BASE_URL) : undefined,
  // Pages with generateMetadata set just their own name; the template appends the brand.
  title: { default: "Path Kids — Collectibles Marketplace", template: "%s — Path Kids" },
  description:
    "A multilingual marketplace for designer toys, blind boxes, figures, art books and digital collectibles.",
  // Demo: drop this when the site is meant to be indexed.
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/brand/path-kids-badge.webp", type: "image/webp" }],
    apple: "/brand/path-kids-badge.webp",
  },
};

interface RootDocumentProps {
  lang: Lang;
  // The admin stays in English but shows catalog text in any language.
  cyrillic?: boolean;
  children: React.ReactNode;
}

// The <html> shell shared by the two root layouts: [locale] and admin.
export function RootDocument({ lang, cyrillic = lang === "ru", children }: RootDocumentProps) {
  const fonts = [body.variable, heading.variable];
  if (cyrillic) fonts.push(bodyCyrillic.variable, headingCyrillic.variable);

  return (
    <html lang={localeTag(lang)} dir={isRtl(lang) ? "rtl" : "ltr"} className={fonts.join(" ")}>
      <head>
        {/* Icon set (nav, footer socials, placeholders) — CDN, no bundled dependency. */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_SITE_DOMAIN!}
          customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL}
          selfHosted
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <NavBar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
