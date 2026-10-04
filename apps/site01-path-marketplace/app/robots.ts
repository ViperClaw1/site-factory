import type { MetadataRoute } from "next";

// Demo lock. Crawling stays allowed so bots can see the noindex header and
// drop already-known URLs. The public allow-list and sitemap belong back here
// when the site launches:
//   allow: "/", disallow: /api /auth /account /cart /checkout /favorites and auth routes
//   sitemap: `${process.env.BASE_URL}/sitemap.xml`
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
