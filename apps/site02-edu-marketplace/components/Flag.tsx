import { Flag as SharedFlag } from "@repo/i18n/client";
import type { Lang } from "@/lib/i18n/locales";

// The shared flag with this site's frame.
export function Flag({ code, className = "h-3.5 w-5" }: { code: Lang; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-[3px] ring-1 ring-white/15 [&>svg]:h-full [&>svg]:w-full ${className}`}
    >
      <SharedFlag code={code} />
    </span>
  );
}
