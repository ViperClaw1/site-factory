/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/lib", "@repo/types"],
  async rewrites() {
    return [
      {
        source: "/stats/js/script.js",
        destination: `${process.env.NEXT_PUBLIC_PLAUSIBLE_URL}/js/script.js`,
      },
      {
        source: "/stats/api/event",
        destination: `${process.env.NEXT_PUBLIC_PLAUSIBLE_URL}/api/event`,
      },
    ];
  },
};

module.exports = nextConfig;
