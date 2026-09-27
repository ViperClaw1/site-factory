/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/lib", "@repo/types"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  async rewrites() {
    const plausibleUrl = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;
    if (!plausibleUrl) {
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
