import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const body = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});

// Newsreader has no Cyrillic subset; Source Serif 4 is a close serif with full cyrillic + italic.
const heading = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Курсы Path Animation",
  description: "Образовательная платформа: курсы как отдельные продукты, практика после покупки.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${body.variable} ${heading.variable}`}>
      <head>
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost"}
          customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL}
          selfHosted
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
