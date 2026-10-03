import "server-only";

import { createSupabaseServerClient } from "@repo/lib/supabase-server";
import type { User } from "@supabase/supabase-js";
import { ADMIN_PUBLIC, roleOf } from "@/lib/rbac";

export type AdminGate = { ok: true; user: User } | { ok: false; status: 401 | 404 };

// getUser() revalidates the JWT. A missing session is 401; a signed-in
// non-admin is 404 so the route does not advertise itself.
export async function requireAdmin(): Promise<AdminGate> {
  // Same temporary switch as ADMIN_PUBLIC. Callers only check `ok`.
  if (ADMIN_PUBLIC) return { ok: true, user: null as unknown as User };

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };
  if (roleOf(user) !== "admin") return { ok: false, status: 404 };
  return { ok: true, user };
}
