"use client";

import { LOCALE_LABELS, LOCALES, useLocaleStore, useT, type MessageKey } from "@/lib/i18n";
import { placeholderCharacters } from "@/lib/placeholders";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Logo } from "./NavBar";

const SHOP_LINKS: { key: MessageKey; href: string }[] = [
  { key: "footer.newArrivals", href: "/shop?sort=newest" },
  { key: "tile.blindBoxes", href: "/shop/collectible_toys" },
  { key: "tile.figures", href: "/shop/figures" },
  { key: "tile.megaFigures", href: "/shop/figures" },
  { key: "tile.digital", href: "/shop/designs" },
  { key: "footer.giftCards", href: "/shop/merch" },
];

// Support pages don't exist yet — these render as plain labels until they do.
const SUPPORT_KEYS: MessageKey[] = [
  "footer.faq",
  "footer.shipping",
  "footer.returns",
  "footer.track",
  "footer.contact",
  "footer.stores",
];

const SOCIALS = [
  { icon: "fa-brands fa-instagram", label: "Instagram" },
  { icon: "fa-brands fa-x-twitter", label: "X" },
  { icon: "fa-brands fa-tiktok", label: "TikTok" },
  { icon: "fa-brands fa-youtube", label: "YouTube" },
];

// Static IP list (the footer lives in the root layout, outside any data fetch).
const CHARACTERS = placeholderCharacters();

// 5-column footer (brand, shop, characters, support, newsletter) topped by a
// Memphis color stripe, with a language bar that shares the nav's locale store.
export function Footer() {
  const { t, locale } = useT();
  const setLocale = useLocaleStore((state) => state.setLocale);
  const [subscribed, setSubscribed] = useState(false);

  // No newsletter provider is wired up — acknowledge locally, send nothing.
  function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    setSubscribed(true);
  }

  const headingClass = "eyebrow mb-4 text-ink";
  const linkClass = "text-sm text-black/55 transition-colors hover:text-pink";

  return (
    <footer className="mt-10 bg-cream">
      {/* Color stripe */}
      <div className="grid h-1.5 grid-cols-4" aria-hidden="true">
        <span className="bg-pink" />
        <span className="bg-sun" />
        <span className="bg-electric" />
        <span className="bg-ink" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
        {/* Brand + socials */}
        <div>
          <Logo />
          <p className="mt-3 text-sm text-black/55">{t("footer.tagline")}</p>
          <div className="mt-5 flex gap-2">
            {SOCIALS.map((social) => (
              <span
                key={social.label}
                title={social.label}
                className="flex h-8 w-8 items-center justify-center bg-black/5 text-xs text-black/60 transition-colors hover:bg-ink hover:text-white"
              >
                <i className={social.icon} aria-hidden="true" />
                <span className="sr-only">{social.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <p className={headingClass}>{t("footer.shop")}</p>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className={linkClass}>
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Characters */}
        <div>
          <p className={headingClass}>{t("footer.characters")}</p>
          <ul className="space-y-2.5">
            {CHARACTERS.map((character) => (
              <li key={character.slug}>
                <Link href={`/characters/${character.slug}`} className={linkClass}>
                  {character.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <p className={headingClass}>{t("footer.support")}</p>
          <ul className="space-y-2.5">
            {SUPPORT_KEYS.map((key) => (
              <li key={key} className="text-sm text-black/55">
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <p className={headingClass}>{t("footer.newsletter")}</p>
          <p className="text-sm text-black/55">{t("footer.newsletterBody")}</p>
          {subscribed ? (
            <p className="mt-4 text-sm font-semibold text-pink">{t("footer.subscribed")}</p>
          ) : (
            <form onSubmit={handleSubscribe} className="mt-4 flex">
              <input
                type="email"
                required
                aria-label={t("footer.newsletter")}
                placeholder={t("footer.emailPlaceholder")}
                className="min-w-0 flex-1 border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-pink"
              />
              <button
                type="submit"
                aria-label={t("footer.subscribe")}
                className="flex w-11 items-center justify-center bg-pink text-white transition-colors hover:bg-pink-dark"
              >
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom bar: copyright + language switcher (synced with the nav dropdown). */}
      <div className="border-t border-black/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 text-xs text-black/45 sm:flex-row sm:px-6 lg:px-8">
          <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
          <div className="flex flex-wrap justify-center gap-1" role="group" aria-label="Language">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={code === locale}
                className={`px-2.5 py-1 font-semibold transition-colors ${
                  code === locale ? "bg-ink text-white" : "text-black/50 hover:text-ink"
                }`}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
