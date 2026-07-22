import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import PlausibleProvider from "next-plausible";
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
        <PlausibleProvider
          domain={process.env.NEXT_PUBLIC_SITE_DOMAIN!}
          customDomain={process.env.NEXT_PUBLIC_PLAUSIBLE_URL}
          selfHosted
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
