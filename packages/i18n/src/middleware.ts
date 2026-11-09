import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, isLang } from "./locales";
import { pickLocale, withLocale } from "./routing";

// A first segment shaped like a language code that we don't serve (/xx/shop).
const LOCALE_LIKE = /^[a-z]{2}(?:-[a-z]{2})?$/i;

// Returns the response to send, or null when the address already has a valid
// language and the request can continue.
export function localeMiddleware(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1] ?? "";
  if (isLang(first)) return null;

  // No route is named /404, so this renders the site's standard not-found page.
  if (LOCALE_LIKE.test(first)) return NextResponse.rewrite(new URL("/404", request.url));

  // The root negotiates a language (307). Old addresses without a prefix move
  // permanently (308) to the saved language or the default one.
  const isRoot = pathname === "/";
  const cookie = request.cookies.get(LANG_COOKIE)?.value;
  const lang = pickLocale(cookie, isRoot ? request.headers.get("accept-language") : null);

  const url = request.nextUrl.clone();
  url.pathname = withLocale(pathname, lang);
  const response = NextResponse.redirect(url, isRoot ? 307 : 308);

  // The target depends on the visitor, so neither a CDN nor the browser may keep it.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
