import type { User } from "@supabase/supabase-js";

// Simple RBAC shared by middleware (route gating) and client components
// (UI gating). The role comes from the JWT's app_metadata, which only the
// service role can write — see supabase/migrations/*_auth_profiles.sql.
// Data access is still enforced by RLS; this map only decides what to show
// and which routes to let through.

export type Role = "guest" | "customer" | "admin";
export type Permission = "cart" | "favorites" | "profile" | "admin";

// TEMPORARY. Catalog admin is open to everyone, including logged-out visitors.
// To restore the role gate: set this to false and add "/admin/:path*" back to
// the matcher in middleware.ts.
export const ADMIN_PUBLIC = true;

const GRANTS: Record<Role, readonly Permission[]> = {
  // Guests keep the local cart + mock checkout (tests/shopping-flow.spec.ts).
  guest: ["cart"],
  customer: ["cart", "favorites", "profile"],
  admin: ["cart", "favorites", "profile", "admin"],
};

// Route prefix → permission it requires. Anything unlisted is public.
// While ADMIN_PUBLIC is set, /admin is not in this list. When the flag goes
// back to false, restore ["/admin", "admin"]: guests then go to /login, and
// a signed-in customer is rewritten to 404.
const PROTECTED_ROUTES: [prefix: string, permission: Permission][] = [
  ["/account", "profile"],
  ["/favorites", "favorites"],
  ...(ADMIN_PUBLIC ? [] : [["/admin", "admin"] as [string, Permission]]),
];

export function roleOf(user: User | null): Role {
  if (!user) return "guest";
  return user.app_metadata?.role === "admin" ? "admin" : "customer";
}

export function can(role: Role, permission: Permission): boolean {
  return GRANTS[role].includes(permission);
}

export function requiredPermission(pathname: string): Permission | null {
  const match = PROTECTED_ROUTES.find(
    ([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ? match[1] : null;
}

// Only same-site relative paths are allowed as post-login redirects, so
// ?next=https://evil.example can't turn /login into an open redirect.
// `fallback` when there's no (safe) ?next: home after login, the profile page
// after signup (AuthForm passes that one).
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
