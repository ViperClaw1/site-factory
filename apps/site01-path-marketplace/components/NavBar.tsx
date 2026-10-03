"use client";

import { initAuth, useAuthStore } from "@/lib/auth";
import { ADMIN_PUBLIC } from "@/lib/rbac";
import { useCartStore } from "@/lib/cart";
import { LOCALES, localeTag, useLocaleStore, useT, type MessageKey } from "@/lib/i18n";
import { FlagIcon } from "./FlagIcon";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS: { key: MessageKey; href: string }[] = [
  { key: "nav.new", href: "/shop?sort=newest" },
  { key: "nav.characters", href: "/characters" },
  { key: "nav.categories", href: "/shop" },
  { key: "nav.collabs", href: "/collections" },
  { key: "nav.digital", href: "/shop/designs" },
];

// Brand: the full Path Kids logo (path-kids-logo-dark-full.webp) centered on a
// circular ink-black badge, transparent outside the circle. The logo's thin
// line-art strokes are thickened (radius-3 dilation at 1024px) so the bear and
// letters stay legible at header size. Served as-is (unoptimized) — a lossless
// 320px WebP (~6× display size), crisp on 3× screens; Next's optimizer would
// re-encode it lossily.
// Full-resolution master: public/brand/path-kids-badge-full.webp (1024px).
export function Logo() {
  return (
    <Link href="/" className="flex items-center" aria-label="Path Kids home">
      <Image
        src="/brand/path-kids-badge.webp"
        alt="Path Kids"
        width={320}
        height={320}
        unoptimized
        priority
        className="h-14 w-14 shrink-0 rounded-full"
      />
    </Link>
  );
}

// Sticky site nav: wordmark, animated-underline links, language dropdown,
// search/wishlist/cart icons, and a hamburger panel below `lg`.
export function NavBar() {
  const { t, locale } = useT();
  const setLocale = useLocaleStore((state) => state.setLocale);
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));

  const signedIn = useAuthStore((state) => state.role !== "guest");
  const role = useAuthStore((state) => state.role);
  const authReady = useAuthStore((state) => state.ready);
  const showAdmin = ADMIN_PUBLIC || (authReady && role === "admin");

  // Both persisted stores skip SSR hydration; the nav is on every page, so it
  // owns the one-time rehydrate for the cart and the saved locale, plus the
  // Supabase auth subscription.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useLocaleStore.persist.rehydrate();
    setHydrated(true);
    return initAuth();
  }, []);

  // Keep <html lang> in sync so screen readers/fonts pick the right language.
  useEffect(() => {
    document.documentElement.lang = localeTag(locale);
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  // Close the mobile panel on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Language dropdown: dismiss on outside click or Escape.
  useEffect(() => {
    if (!langOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLangOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [langOpen]);

  const iconClass =
    "flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-pink";

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop links — pink underline grows from the left on hover. */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className="group relative py-2 text-sm font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {t(link.key)}
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-pink transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {/* Language dropdown */}
          <div ref={langRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={t("nav.language")}
              className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ink hover:bg-black/5"
            >
              <FlagIcon locale={locale} />
              {LOCALES.find((item) => item.code === locale)?.label}
              <i
                className={`fa-solid fa-chevron-down text-[9px] text-black/40 transition-transform ${langOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.ul
                  role="listbox"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,70vh)] w-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-lg"
                >
                  {LOCALES.map((item) => {
                    const selected = item.code === locale;
                    return (
                      <li key={item.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            setLocale(item.code);
                            setLangOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm ${
                            selected ? "bg-pink text-white" : "text-ink hover:bg-black/[0.04]"
                          }`}
                        >
                          <FlagIcon locale={item.code} />
                          <span className="flex-1 font-medium leading-none">{item.native}</span>
                          <span className={`text-xs ${selected ? "text-white/80" : "text-black/40"}`}>{item.label}</span>
                          {selected && <i className="fa-solid fa-check text-[11px]" aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Utility icons: search goes to the shop. Favorites, account and
              cart are for signed-in users; guests get a single sign-in icon.
              Nothing auth-dependent renders until the session is known, so a
              signed-in visitor never sees the guest icon flash first. */}
          {showAdmin && (
            <Link href="/admin" className="hidden px-2 text-sm font-semibold text-ink hover:text-pink lg:inline">
              Admin
            </Link>
          )}
          <Link href="/shop" className={iconClass} aria-label={t("nav.search")}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </Link>
          {authReady &&
            (signedIn ? (
              <>
                <Link href="/favorites" className={`${iconClass} hidden sm:flex`} aria-label={t("nav.wishlist")} title={t("nav.wishlist")}>
                  <i className="fa-regular fa-heart" aria-hidden="true" />
                </Link>
                <Link href="/account" className={iconClass} aria-label={t("nav.account")} title={t("nav.account")}>
                  <i className="fa-solid fa-user" aria-hidden="true" />
                </Link>
                <Link href="/cart" className={`${iconClass} relative`} aria-label={t("nav.cart")}>
                  <i className="fa-solid fa-bag-shopping" aria-hidden="true" />
                  {hydrated && itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-0.5 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink px-1 text-[10px] font-bold text-white"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </Link>
              </>
            ) : (
              <Link href="/login" className={iconClass} aria-label={t("nav.signIn")} title={t("nav.signIn")}>
                <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
              </Link>
            ))}

          {/* Hamburger (mobile/tablet only) */}
          <button
            type="button"
            className={`${iconClass} lg:hidden`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={t("nav.menu")}
          >
            <i className={`fa-solid ${menuOpen ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile panel: stacked links + language chips. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-black/5 bg-white lg:hidden"
          >
            <nav className="flex flex-col px-4 py-4 sm:px-6" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="font-display border-b border-black/5 py-3 text-2xl text-ink hover:text-pink"
                >
                  {t(link.key)}
                </Link>
              ))}
              {showAdmin && (
                <Link href="/admin" className="font-display border-b border-black/5 py-3 text-2xl text-ink hover:text-pink">
                  Admin
                </Link>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {LOCALES.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLocale(item.code)}
                    className={`px-3 py-1.5 text-xs font-semibold ${
                      item.code === locale ? "bg-ink text-white" : "bg-black/5 text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
