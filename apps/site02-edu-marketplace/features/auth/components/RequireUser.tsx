"use client";

import { useLocale, useLocalizedRouter } from "@repo/i18n/client";
import { withLocale } from "@repo/i18n";
import { useEffect, type ReactNode } from "react";
import { useUser } from "@/features/auth/hooks";

// Client guard for pages that belong to a signed-in learner.
export function RequireUser({ next, children }: { next: string; children: ReactNode }) {
  const { user, ready } = useUser();
  const router = useLocalizedRouter();
  const locale = useLocale();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(withLocale(next, locale))}`);
  }, [ready, user, router, next, locale]);

  if (!ready || !user) return null;
  return children;
}
