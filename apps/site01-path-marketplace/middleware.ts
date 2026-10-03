import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { can, requiredPermission, roleOf } from "@/lib/rbac";

// Refreshes the Supabase session cookie and gates protected routes
// (lib/rbac.ts) — guests are sent to /login?next=<path>.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // getUser() (not getSession()) — it revalidates the JWT with Supabase Auth.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const permission = requiredPermission(request.nextUrl.pathname);
  if (permission && !can(roleOf(user), permission)) {
    // A signed-in customer must not learn that /admin exists.
    if (permission === "admin" && user) {
      const hidden = request.nextUrl.clone();
      hidden.pathname = "/404";
      hidden.search = "";
      return NextResponse.rewrite(hidden);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Only the protected routes — keeps a Supabase Auth round-trip off every
  // public catalog page. The browser client refreshes the session elsewhere.
  // Keep in sync with PROTECTED_ROUTES in lib/rbac.ts.
  // "/admin/:path*" stays off while ADMIN_PUBLIC is true in lib/rbac.ts.
  // Put it back here together with that flag.
  matcher: ["/account/:path*", "/favorites/:path*"],
};
