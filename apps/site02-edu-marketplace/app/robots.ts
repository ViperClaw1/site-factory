import type { MetadataRoute } from "next";

// Demo lock. Crawling stays allowed so bots can see the noindex header and
// drop already-known URLs. The public allow-list and sitemap belong back here
// when the site launches:
//   allow: "/", disallow: /api /auth /account /learn /cart /checkout and auth routes
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
