import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import PlausibleProvider from "next-plausible";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const heading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Path Animation Marketplace",
  description: "Collectible toys, art, and digital drops from Path Animation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <head>
        {/* Icon set for placeholder cards (no product photo yet) — CDN, no bundled dependency. */}
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
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
