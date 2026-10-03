"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUser } from "@/features/auth/hooks";

// Client guard for pages that belong to a signed-in learner.
export function RequireUser({ next, children }: { next: string; children: ReactNode }) {
  const { user, ready } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [ready, user, router, next]);

  if (!ready || !user) return null;
  return children;
}
