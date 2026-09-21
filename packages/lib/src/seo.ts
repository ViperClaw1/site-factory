import type { Metadata } from "next";
import type { Course, Product } from "@repo/types";

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

// Render with: <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
// JSON.stringify already escapes quotes; </script> in string content is the
// one sequence that would otherwise break out of the tag, so it's escaped
// separately rather than trusting the field never contains it.
function toJsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function generateProductJsonLd(product: Product, url: string): string {
  return toJsonLdScript({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((image) => image.url),
    sku: product.id,
    url,
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.base_price,
      availability:
        product.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
    },
  });
}

export function generateCourseJsonLd(course: Course, url: string): string {
  return toJsonLdScript({
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description ?? course.subtitle ?? undefined,
    url,
    image: course.cover_image ?? undefined,
    inLanguage: course.language,
    offers: {
      "@type": "Offer",
      priceCurrency: course.currency,
      price: course.price,
      url,
      availability:
        course.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/Discontinued",
    },
  });
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]): string {
  return toJsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}
