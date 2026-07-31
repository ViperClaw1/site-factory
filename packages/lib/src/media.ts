// Directus media is served from its own DNS record (NEXT_PUBLIC_DIRECTUS_ASSETS_URL),
// kept separate from the content API (NEXT_PUBLIC_DIRECTUS_URL) even though
// both currently point at the same host. Assets are the fastest-growing
// piece of the infra budget and the planned move to Cloudflare R2/a CDN, so
// every image URL across the 20 sites resolves through this one function —
// the migration becomes a DNS change instead of a content rewrite.
export function getDirectusAssetUrl(assetId: string): string {
  const assetsUrl = process.env.NEXT_PUBLIC_DIRECTUS_ASSETS_URL;
  if (!assetsUrl) {
    throw new Error("NEXT_PUBLIC_DIRECTUS_ASSETS_URL is not set");
  }

  return `${assetsUrl}/assets/${assetId}`;
}
