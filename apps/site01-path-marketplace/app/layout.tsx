import type { Metadata } from "next";
import { Alegreya, Fraunces, Onest, Outfit } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

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
// Latin glyphs too.
const bodyCyrillic = Onest({
  subsets: ["cyrillic"],
  variable: "--font-body-cyrillic",
  display: "swap",
});

const headingCyrillic = Alegreya({
  subsets: ["cyrillic"],
  weight: "900",
  variable: "--font-heading-cyrillic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ToyVerse — Collectibles Marketplace",
  description:
    "A multilingual marketplace for designer toys, blind boxes, figures, art books and digital collectibles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} ${bodyCyrillic.variable} ${headingCyrillic.variable}`}>
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
