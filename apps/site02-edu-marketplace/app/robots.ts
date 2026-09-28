import type { MetadataRoute } from "next";

// Catalog and marketing are public; API, auth, per-user and lesson-player pages have nothing to index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/account",
        "/learn",
        "/cart",
        "/checkout",
        "/login",
        "/signup",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${process.env.BASE_URL ?? "http://localhost:3002"}/sitemap.xml`,
  };
}
