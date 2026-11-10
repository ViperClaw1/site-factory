"use client";

import { LanguageLink, Link } from "@repo/i18n/client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LOCALES } from "@/lib/i18n/locales";
import { useUser } from "@/features/auth/hooks";
import { useCartIds } from "@/features/cart/store";
import { SECTIONS } from "@/features/landing/data";
import { SECTION_ICONS } from "@/features/landing/sectionIcons";
import { CartIcon, ChevronDownIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from "./icons";
import { Flag } from "./Flag";
import { LanguageMenu } from "./LanguageMenu";
import { Logo } from "./Logo";
import { ThemeSwitch } from "./ThemeSwitch";

/* ---- Desktop "Courses" dropdown: course sections + link to the full catalog ----
   Opens on hover, and on click / keyboard (Escape or focus leaving the menu closes it). */
function CoursesMenu({ label }: { label: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={root}
      // Hover/blur wrapper only; the <button> below is the interactive control.
      role="presentation"
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
      onBlur={(event) => {
        if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1 transition hover:text-white ${open ? "text-white" : ""}`}
      >
        {label}
        <ChevronDownIcon className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        // pt-3 bridges the gap so the hover doesn't drop between button and panel.
        <div className="absolute start-1/2 top-full z-50 -translate-x-1/2 pt-3 rtl:translate-x-1/2">
          <div className="anim-fade-up w-[34rem] rounded-3xl border border-white/10 bg-canvas/90 p-3 shadow-2xl backdrop-blur-xl">
            <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">{t.nav.sections}</p>
            <div className="grid grid-cols-2 gap-1">
              {SECTIONS.map((section) => {
                const Icon = SECTION_ICONS[section];
                return (
                  <Link
                    key={section}
                    href={`/courses/s/${section}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 whitespace-normal rounded-2xl p-3 transition hover:bg-white/[0.06]"
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span>
                      <span className="block font-semibold text-white">{t.courses.sections[section]}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{t.courses.sectionBlurbs[section]}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-2xl bg-white/[0.05] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-brand hover:text-ink"
            >
              {t.nav.allCourses}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { t, lang } = useI18n();
  const { user, ready } = useUser();
  const cartCount = useCartIds().length;
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Transparent over the hero, frosted glass once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { href: "/news", label: t.nav.news },
    { href: "/#courses", label: t.nav.courses },
    { href: "/#how", label: t.nav.how },
    { href: "/#instructors", label: t.nav.instructors },
    { href: "/#reviews", label: t.nav.reviews },
    { href: "/#pricing", label: t.nav.pricing },
  ];
  const userLinks = [
    { href: "/profile", label: t.nav.profile, Icon: UserIcon },
    { href: "/account/favorites", label: t.nav.favorites, Icon: HeartIcon },
  ];
  const glass = scrolled || mobileOpen;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
        glass ? "border-white/10 bg-canvas/70 backdrop-blur-xl backdrop-saturate-150" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 xl:gap-6 xl:px-8">
        <Logo />

        <nav className="hidden items-center gap-5 whitespace-nowrap text-sm font-medium text-white/65 xl:flex 2xl:gap-7">
          {nav.map((item) =>
            item.href === "/#courses" ? (
              <CoursesMenu key={item.href} label={item.label} />
            ) : (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <Link href="/admin" className="hidden whitespace-nowrap px-2 text-sm font-semibold text-white/80 hover:text-brand xl:inline">
            Admin
          </Link>
          <ThemeSwitch />
          <LanguageMenu />
          <Link
            href="/cart"
            aria-label={cartCount > 0 ? `${t.nav.cart} (${cartCount})` : t.nav.cart}
            title={t.nav.cart}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/75 transition hover:border-brand hover:text-brand"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-none text-ink">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          {user ? (
            /* Signed in: account shortcuts (always visible, incl. mobile). */
            userLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/75 transition hover:border-brand hover:text-brand"
              >
                <Icon />
              </Link>
            ))
          ) : (
            /* Guest (or session still loading — render nothing to avoid a flash). */
            ready && (
              <>
                <Link
                  href="/login"
                  className="hidden h-10 items-center whitespace-nowrap px-3 text-sm font-medium text-white/75 transition hover:text-white sm:inline-flex"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/#pricing"
                  className="hidden h-10 items-center whitespace-nowrap rounded-full bg-brand px-5 text-sm font-bold text-ink transition hover:bg-brand-dark md:inline-flex"
                >
                  {t.nav.cta}
                </Link>
              </>
            )
          )}
          <button
            type="button"
            aria-label={t.nav.menu}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 xl:hidden"
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* ---- Mobile drawer ---- */}
      {mobileOpen && (
        <nav className="anim-fade-up border-t border-white/10 px-4 pb-6 pt-2 sm:px-6 xl:hidden">
          <Link href="/admin" onClick={() => setMobileOpen(false)} className="block border-b border-white/5 py-3.5 text-base font-medium text-white/80">
            Admin
          </Link>
          {nav.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block border-b border-white/5 py-3.5 text-base font-medium text-white/80"
              >
                {item.label}
              </Link>
              {/* ---- Course sections, indented under "Courses" ---- */}
              {item.href === "/#courses" && (
                <div className="grid grid-cols-2 gap-x-3 border-b border-white/5 py-2 ps-3">
                  {SECTIONS.map((section) => (
                    <Link
                      key={section}
                      href={`/courses/s/${section}`}
                      onClick={() => setMobileOpen(false)}
                      className="py-2 text-sm text-white/65 transition hover:text-brand"
                    >
                      {t.courses.sections[section]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-4 grid grid-cols-8 gap-1.5" role="group" aria-label={t.nav.language}>
            {LOCALES.map((locale) => {
              const selected = locale.code === lang;
              return (
                <LanguageLink
                  key={locale.code}
                  lang={locale.code}
                  aria-label={locale.native}
                  title={locale.native}
                  className={`grid h-9 place-items-center rounded-lg transition ${
                    selected ? "bg-white/10 ring-1 ring-brand/60" : "bg-white/[0.04] hover:bg-white/[0.08]"
                  }`}
                >
                  <Flag code={locale.code} className="h-4 w-6" />
                </LanguageLink>
              );
            })}
          </div>
          {ready && !user && (
          <div className="mt-5 flex gap-3">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-full border border-white/15 py-3 text-center text-sm font-semibold"
            >
              {t.nav.login}
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileOpen(false)}
              className="flex-1 rounded-full bg-brand py-3 text-center text-sm font-bold text-ink"
            >
              {t.nav.cta}
            </Link>
          </div>
          )}
        </nav>
      )}
    </header>
  );
}
