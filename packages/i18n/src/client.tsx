"use client";

import NextLink from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { Flag } from "./Flag";
import { DEFAULT_LANG, LANG_COOKIE, LOCALES, isLang, localeTag, type Lang } from "./locales";
import { withLocale } from "./routing";

export { Flag };

// The language of the current route. Pages outside [locale], such as /admin,
// have no such param and get the default language.
export function useLocale(): Lang {
  const locale = useParams()?.locale;
  return isLang(locale) ? locale : DEFAULT_LANG;
}

// next/link that adds the current language to internal hrefs.
export const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(function Link(
  { href, ...props },
  ref,
) {
  const locale = useLocale();
  const target =
    typeof href === "string"
      ? withLocale(href, locale)
      : { ...href, pathname: href.pathname ? withLocale(href.pathname, locale) : href.pathname };
  return <NextLink ref={ref} href={target} {...props} />;
});

// useRouter that adds the current language to push, replace and prefetch.
export function useLocalizedRouter() {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(withLocale(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(withLocale(href, locale), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(withLocale(href, locale), options),
    }),
    [router, locale],
  );
}

type LanguageLinkProps = Omit<ComponentProps<typeof NextLink>, "href" | "lang"> & { lang: Lang };

// The same page in another language. A real link, so crawlers and new tabs work.
// Renders nothing outside [locale] routes, where there is no language to switch.
export function LanguageLink({ lang, onClick, ...props }: LanguageLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const current = useParams()?.locale;
  if (!isLang(current)) return null;

  const href = withLocale(pathname, lang);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    // The query is read at click time: useSearchParams here would force a
    // Suspense boundary around the header and footer of every page.
    event.preventDefault();
    router.push(`${href}${window.location.search}${window.location.hash}`, { scroll: false });
  }

  return (
    <NextLink
      {...props}
      href={href}
      // Footers list all 19 languages; don't fetch them on every page view.
      prefetch={false}
      hrefLang={localeTag(lang)}
      lang={localeTag(lang)}
      aria-current={lang === current ? "true" : undefined}
      onClick={handleClick}
    />
  );
}

export interface LanguageMenuClasses {
  root?: string;
  trigger?: string;
  label?: string;
  list?: string;
  item?: string;
  itemActive?: string;
  itemIdle?: string;
  code?: string;
  codeActive?: string;
  codeIdle?: string;
}

interface LanguageMenuProps {
  ariaLabel: string;
  classes: LanguageMenuClasses;
  renderFlag: (code: Lang) => ReactNode;
  renderChevron: (open: boolean) => ReactNode;
  check: ReactNode;
}

// Dropdown from the ecosystem rules: flag, name in its own language, code.
// Behaviour lives here; each site passes its own styling.
export function LanguageMenu({ ariaLabel, classes, renderFlag, renderChevron, check }: LanguageMenuProps) {
  const locale = useLocale();
  const hasLocale = isLang(useParams()?.locale);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((item) => item.code === locale) ?? LOCALES[0];

  // Dismiss on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!hasLocale) return null;

  return (
    <div ref={rootRef} className={classes.root}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((value) => !value)}
        className={classes.trigger}
      >
        {renderFlag(current.code)}
        <span className={classes.label}>{current.label}</span>
        {renderChevron(open)}
      </button>

      {open && (
        <ul aria-label={ariaLabel} className={classes.list}>
          {LOCALES.map((item) => {
            const active = item.code === locale;
            return (
              <li key={item.code}>
                <LanguageLink
                  lang={item.code}
                  onClick={() => setOpen(false)}
                  className={`${classes.item ?? ""} ${(active ? classes.itemActive : classes.itemIdle) ?? ""}`}
                >
                  {renderFlag(item.code)}
                  <span className="flex-1">{item.native}</span>
                  <span className={`${classes.code ?? ""} ${(active ? classes.codeActive : classes.codeIdle) ?? ""}`}>
                    {item.label}
                  </span>
                  {active && check}
                </LanguageLink>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
