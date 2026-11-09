import { Flag } from "@repo/i18n/client";
import type { Locale } from "@/lib/i18n";

// The shared flag with this site's frame.
export function FlagIcon({ locale, className = "" }: { locale: Locale; className?: string }) {
  return (
    <Flag
      code={locale}
      className={`block h-3.5 w-5 shrink-0 rounded-[2px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] ${className}`}
    />
  );
}
