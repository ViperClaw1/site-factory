import type { Metadata } from "next";
import { Fraunces, Onest, Outfit, Playfair_Display } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

// Outfit for body copy, Fraunces (variable, with its SOFT/WONK axes) for the
// heavy display headlines.
const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

// Cyrillic-only fallbacks for the ru locale — Outfit and Fraunces ship no
// Cyrillic glyphs. Onest is a close geometric match for Outfit; Playfair
// Display 900 stands in for heavy Fraunces. Their cyrillic-subset
// unicode-range means Latin text never pulls these files.
const bodyCyrillic = Onest({
  subsets: ["cyrillic"],
  variable: "--font-body-cyrillic",
  display: "swap",
});

const headingCyrillic = Playfair_Display({
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
