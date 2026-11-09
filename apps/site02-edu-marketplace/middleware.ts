import { localeMiddleware } from "@repo/i18n/middleware";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return localeMiddleware(request) ?? NextResponse.next();
}

export const config = {
  // Everything except addresses that never carry a language (decision 4 of the
  // locale plan): API, Supabase callback, admin, analytics proxy, assets and files.
  matcher: ["/((?!api(?:/|$)|auth/callback|admin(?:/|$)|stats/|_next/|.*\\..*).*)"],
};
