// Server-only modules (next/headers, Directus, R2 secrets) are intentionally
// excluded from this barrel so client components never pull them into the
// bundle. Import them directly: @repo/lib/directus, @repo/lib/supabase-server,
// @repo/lib/r2.
//
// analytics is excluded too, for the opposite reason: it calls the
// client-only usePlausible hook with no "use client" boundary of its own, so
// re-exporting it here lets it leak into server-only files (e.g. api-client.ts)
// through the barrel and corrupts the RSC webpack bundle. Import it directly:
// @repo/lib/analytics.
export * from "./supabase";
export * from "./animations";
export * from "./seo";
export * from "./format";
export * from "./media";
