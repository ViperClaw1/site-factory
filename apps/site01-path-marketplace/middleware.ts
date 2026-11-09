import { LANG_COOKIE, localeOf, pickLocale, stripLocale } from "@repo/i18n";
import { localeMiddleware } from "@repo/i18n/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { can, requiredPermission, roleOf } from "@/lib/rbac";

// Language first, then the Supabase session and route gate (lib/rbac.ts).
// Guests are sent to /<lang>/login?next=<path>.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin never has a prefix; it only gets here when its gate is back on.
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const localeResponse = isAdmin ? null : localeMiddleware(request);
  if (localeResponse) return localeResponse;

  // Public pages stop here: no Supabase Auth round-trip on the catalog. The
  // browser client refreshes the session elsewhere.
  const permission = requiredPermission(stripLocale(pathname));
  if (!permission) return NextResponse.next();

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

  if (!can(roleOf(user), permission)) {
    // A signed-in customer must not learn that /admin exists.
    if (permission === "admin" && user) {
      const hidden = request.nextUrl.clone();
      hidden.pathname = "/404";
      hidden.search = "";
      return NextResponse.rewrite(hidden);
    }
    const lang =
      localeOf(pathname) ??
      pickLocale(request.cookies.get(LANG_COOKIE)?.value, request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/login`;
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Everything except addresses that never carry a language (decision 4 of the
  // locale plan): API, Supabase callback, analytics proxy, assets and files.
  // "admin" stays excluded while ADMIN_PUBLIC is true in lib/rbac.ts. Remove it
  // here together with that flag; the handler above already skips its prefix.
  matcher: ["/((?!api(?:/|$)|auth/callback|admin(?:/|$)|stats/|_next/|.*\\..*).*)"],
};
