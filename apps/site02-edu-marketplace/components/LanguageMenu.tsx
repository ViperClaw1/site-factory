"use client";

import { LanguageMenu as SharedLanguageMenu } from "@repo/i18n/client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Flag } from "./Flag";
import { CheckIcon, ChevronDownIcon } from "./icons";

// The shared menu with this site's styling.
export function LanguageMenu() {
  const { t } = useI18n();

  return (
    <SharedLanguageMenu
      ariaLabel={t.nav.language}
      renderFlag={(code) => <Flag code={code} />}
      renderChevron={(open) => (
        <ChevronDownIcon className={`hidden h-4 w-4 text-white/50 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      )}
      check={<CheckIcon className="h-4 w-4" />}
      classes={{
        root: "relative",
        trigger:
          "flex h-10 w-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] text-sm font-medium transition hover:border-white/25 hover:bg-white/[0.08] sm:w-auto sm:px-3",
        label: "hidden sm:inline",
        list: "anim-fade-up absolute right-0 top-full z-50 mt-2 max-h-[min(28rem,70vh)] w-64 overflow-y-auto rounded-2xl border border-white/10 bg-surface/95 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl",
        item: "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
        itemActive: "bg-brand/10 text-brand",
        itemIdle: "text-white/80 hover:bg-white/[0.06] hover:text-white",
        code: "text-xs",
        codeActive: "text-brand/70",
        codeIdle: "text-white/35",
      }}
    />
  );
}
