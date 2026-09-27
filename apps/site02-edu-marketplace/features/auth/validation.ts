import type { Dict } from "@/lib/i18n/dictionaries";

// Client-side validators — each returns an error key from t.auth.errors, or
// null when the value is fine. Supabase re-checks email/password server-side;
// keep PASSWORD_RULES in sync with the project's Auth password settings.

export type AuthErrorKey = keyof Dict["auth"]["errors"];
export type PasswordRule = keyof Dict["auth"]["rules"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Password policy, shown to the user as a live checklist on signup.
export const PASSWORD_RULES: Record<PasswordRule, (value: string) => boolean> = {
  length: (v) => v.length >= 8,
  lower: (v) => /[a-z]/.test(v),
  upper: (v) => /[A-Z]/.test(v),
  digit: (v) => /\d/.test(v),
};

export function validateEmail(value: string): AuthErrorKey | null {
  if (!value.trim()) return "emailRequired";
  return EMAIL_RE.test(value.trim()) ? null : "email";
}

// Signup enforces the full policy; login only needs a non-empty value
// (older accounts may predate the policy).
export function validatePassword(value: string, strict: boolean): AuthErrorKey | null {
  if (!value) return "passwordRequired";
  if (!strict) return null;
  return Object.values(PASSWORD_RULES).every((rule) => rule(value)) ? null : "passwordWeak";
}

// Only same-site relative paths, so ?next can't redirect off-site.
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
