"use client";

import { useT, type MessageKey } from "@/lib/i18n";

// Translated text island — lets server components (catalog pages) render
// locale-aware labels without becoming client components themselves.
export function T({ k, vars }: { k: MessageKey; vars?: Record<string, string | number> }) {
  const { t } = useT();
  return <>{t(k, vars)}</>;
}
