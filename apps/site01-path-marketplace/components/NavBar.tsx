"use client";

import { initAuth, useAuthStore } from "@/lib/auth";
import { ADMIN_PUBLIC } from "@/lib/rbac";
import { useCartStore } from "@/lib/cart";
import { LOCALES, useT, type MessageKey } from "@/lib/i18n";
import { FlagIcon } from "./FlagIcon";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { LanguageLink, LanguageMenu, Link } from "@repo/i18n/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));

  const signedIn = useAuthStore((state) => state.role !== "guest");
  const role = useAuthStore((state) => state.role);
  const authReady = useAuthStore((state) => state.ready);
  const showAdmin = ADMIN_PUBLIC || (authReady && role === "admin");

  // The cart store skips SSR hydration; the nav is on every page, so it owns
  // the one-time rehydrate, plus the Supabase auth subscription.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    setHydrated(true);
    return initAuth();
  }, []);

  // Close the mobile panel on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

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
          <LanguageMenu
            ariaLabel={t("nav.language")}
            renderFlag={(code) => <FlagIcon locale={code} />}
            renderChevron={(open) => (
              <i
                className={`fa-solid fa-chevron-down text-[9px] text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            )}
            check={<i className="fa-solid fa-check text-[11px]" aria-hidden="true" />}
            classes={{
              root: "relative hidden sm:block",
              trigger: "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-ink hover:bg-black/5",
              list: "absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,70vh)] w-64 overflow-y-auto rounded-2xl border border-black/10 bg-white p-1.5 shadow-lg",
              item: "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium leading-none",
              itemActive: "bg-pink text-white",
              itemIdle: "text-ink hover:bg-black/[0.04]",
              code: "text-xs font-normal",
              codeActive: "text-white/80",
              codeIdle: "text-black/40",
            }}
          />

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
              <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t("nav.language")}>
                {LOCALES.map((item) => {
                  const selected = item.code === locale;
                  return (
                    <LanguageLink
                      key={item.code}
                      lang={item.code}
                      aria-label={item.native}
                      title={item.native}
                      className={`px-3 py-1.5 ${selected ? "bg-ink" : "bg-black/5"}`}
                    >
                      <FlagIcon locale={item.code} className="h-4 w-6 rounded-[3px]" />
                    </LanguageLink>
                  );
                })}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
