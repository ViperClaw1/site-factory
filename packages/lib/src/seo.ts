import type { Metadata } from "next";

export function generateMetadata(
  title: string,
  description: string,
  image?: string,
  url?: string
): Metadata {
  const base = process.env.BASE_URL;
  const canonical = url ? new URL(url, base).toString() : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
