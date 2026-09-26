import type { MessageKey } from "@/lib/i18n";
import { T } from "./T";

export interface EmptyStateProps {
  messageKey: MessageKey;
}

// Compact notice strip (yellow Memphis accent) above fallback content.
export function EmptyState({ messageKey }: EmptyStateProps) {
  return (
    <div className="flex items-center gap-3 border-l-4 border-sun bg-sun-soft px-4 py-3 text-sm text-ink/80">
      <i className="fa-solid fa-box-open text-ink/40" aria-hidden="true" />
      <p>
        <T k={messageKey} />
      </p>
    </div>
  );
}
