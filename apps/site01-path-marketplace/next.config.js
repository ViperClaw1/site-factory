/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@repo/ui", "@repo/lib", "@repo/types"],
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
