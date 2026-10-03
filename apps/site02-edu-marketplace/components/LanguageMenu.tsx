"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LOCALES } from "@/lib/i18n/locales";
import { Flag } from "./Flag";
import { CheckIcon, ChevronDownIcon } from "./icons";

export function LanguageMenu() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((locale) => locale.code === lang) ?? LOCALES[0];

  // Close on outside click or Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.nav.language}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-medium transition hover:border-white/25 hover:bg-white/[0.08]"
      >
        <Flag code={current.code} />
        <span>{current.label}</span>
        <ChevronDownIcon className={`h-4 w-4 text-white/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.nav.language}
          className="anim-fade-up absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,70vh)] w-64 overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl"
        >
          {LOCALES.map((locale) => {
            const active = locale.code === lang;
            return (
              <li key={locale.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  lang={locale.code}
                  onClick={() => {
                    setLang(locale.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active ? "bg-brand/10 text-brand" : "text-white/80 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Flag code={locale.code} />
                  <span className="flex-1">{locale.native}</span>
                  <span className={`text-xs ${active ? "text-brand/70" : "text-white/35"}`}>{locale.label}</span>
                  {active && <CheckIcon className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
