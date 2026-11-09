import { DEFAULT_LANG, isLang, type Lang } from "./locales";

// Addresses that never carry a language: API and Supabase callback (registered
// in Redirect URLs), the internal admin, the analytics proxy, and any file.
const LOCALE_FREE = /^\/(?:api|admin|stats|_next)(?:\/|$)|^\/auth\/callback(?:\/|$)|\.[a-z0-9]+$/i;

export function isLocaleFree(pathname: string): boolean {
  return LOCALE_FREE.test(pathname);
}

// The language in the first path segment, or null when there is none.
export function localeOf(pathname: string): Lang | null {
  const first = pathname.split(/[/?#]/)[1];
  return isLang(first) ? first : null;
}

// "/de/shop" -> "/shop", "/de" -> "/". Paths without a language pass through.
export function stripLocale(pathname: string): string {
  const lang = localeOf(pathname);
  return lang ? pathname.slice(lang.length + 1) || "/" : pathname;
}

// Puts `lang` on an internal href, replacing any language already there, and
// keeps ?query and #hash. External, relative and locale-free hrefs pass through.
// Also the language switch: withLocale("/de/courses/x", "fr") -> "/fr/courses/x".
export function withLocale(href: string, lang: Lang): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;

  const cut = href.search(/[?#]/);
  const path = cut < 0 ? href : href.slice(0, cut);
  const rest = cut < 0 ? "" : href.slice(cut);
  if (isLocaleFree(path)) return href;

  const bare = stripLocale(path);
  return `/${lang}${bare === "/" ? "" : bare}${rest}`;
}

// Saved choice first, then the browser's list by q-value. Regional variants
// fall back to the base language: pt-PT -> pt, zh-TW -> zh.
export function pickLocale(cookie: string | null | undefined, acceptLanguage: string | null | undefined): Lang {
  if (isLang(cookie)) return cookie;

  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      return { code: tag.split("-")[0]!.toLowerCase(), q: q ? Number(q.slice(2)) : 1 };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);

  return preferred.map((entry) => entry.code).find(isLang) ?? DEFAULT_LANG;
}
