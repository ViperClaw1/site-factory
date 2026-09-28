import type { MetadataRoute } from "next";

// Catalog is public; API, auth and per-user pages have nothing to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/account",
        "/cart",
        "/checkout",
        "/favorites",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${process.env.BASE_URL}/sitemap.xml`,
  };
}
