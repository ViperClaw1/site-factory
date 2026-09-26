/** @type {import('next').NextConfig} */
const nextConfig = {
  // Overridable so a verification build/dev server can run beside a live
  // `next dev` without overwriting its .next output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/lib", "@repo/types"],
  // Product images: Supabase Storage public buckets (real catalog) and
  // Unsplash (showcase fallback in lib/placeholders.ts).
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    const plausibleUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
    if (!plausibleUrl) {
      // Unset in an environment without self-hosted analytics — skip the
      // proxy instead of emitting rewrites to "undefined/js/script.js".
      return [];
    }

    return [
      {
        source: "/stats/js/script.js",
        destination: `${plausibleUrl}/js/script.js`,
      },
      {
        source: "/stats/api/event",
        destination: `${plausibleUrl}/api/event`,
      },
    ];
  },
};

module.exports = nextConfig;
