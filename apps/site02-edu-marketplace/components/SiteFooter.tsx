"use client";

import Link from "next/link";
import { Container } from "@repo/ui";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LOCALES } from "@/lib/i18n/locales";
import { Flag } from "./Flag";
import { GithubIcon, LinkedinIcon, TelegramIcon, YoutubeIcon } from "./icons";
import { Logo } from "./Logo";

// Link targets per footer column, index-aligned with t.footer.cols[i].links.
const columnHrefs = [
  ["/#courses", "/courses", "/courses", "/#how"],
  ["/#how", "/#instructors", "/#", "/#"],
  ["/#", "/#", "/legal/privacy", "/legal/terms"],
];

const socials = [
  { label: "Telegram", Icon: TelegramIcon },
  { label: "YouTube", Icon: YoutubeIcon },
  { label: "GitHub", Icon: GithubIcon },
  { label: "LinkedIn", Icon: LinkedinIcon },
];

export function SiteFooter() {
  const { t, lang, setLang } = useI18n();

  return (
    <footer className="border-t border-white/10 bg-canvas pb-10 pt-16 text-sm">
      <Container>
        {/* ---- Brand + link columns ---- */}
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 leading-relaxed text-muted">{t.footer.tagline}</p>
            <div className="mt-6 flex gap-2">
              {socials.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-brand hover:text-brand"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {t.footer.cols.map((col, colIndex) => (
            <div key={col.title}>
              <p className="font-heading text-sm font-bold text-white">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((label, linkIndex) => (
                  <li key={label}>
                    <Link
                      href={columnHrefs[colIndex]?.[linkIndex] ?? "/#"}
                      className="text-muted transition hover:text-white"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ---- Bottom bar: copyright + language flags ---- */}
        <div className="mt-14 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/40">
            © {new Date().getFullYear()} Path.courses. {t.footer.rights}
          </p>
          <div className="flex flex-wrap items-center gap-1.5" aria-label={t.footer.languages}>
            {LOCALES.map((locale) => (
              <button
                key={locale.code}
                type="button"
                title={locale.native}
                aria-label={locale.native}
                aria-pressed={locale.code === lang}
                onClick={() => setLang(locale.code)}
                className={`rounded-md p-1.5 transition ${
                  locale.code === lang ? "bg-white/10 ring-1 ring-brand/60" : "opacity-60 hover:opacity-100"
                }`}
              >
                <Flag code={locale.code} />
              </button>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
