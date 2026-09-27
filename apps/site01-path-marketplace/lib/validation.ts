import { isValidPhoneNumber } from "react-phone-number-input";
import type { MessageKey } from "./messages";

// Client-side form validators — each returns a message key, or null when the
// value is fine. The same rules are enforced server-side by the profiles
// table check constraints and the avatars bucket limits
// (supabase/migrations/*_auth_profiles.sql); keep them in sync.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateEmail(value: string): MessageKey | null {
  return EMAIL_RE.test(value.trim()) ? null : "valid.email";
}

export function validatePassword(value: string): MessageKey | null {
  return value.length >= 8 ? null : "valid.password";
}

export function validateName(value: string): MessageKey | null {
  const length = value.trim().length;
  return length >= 2 && length <= 80 ? null : "valid.name";
}

// Phone is optional; when present it must be a valid E.164 number.
export function validatePhone(value: string | undefined): MessageKey | null {
  return !value || isValidPhoneNumber(value) ? null : "valid.phone";
}

export function validatePhoto(file: File): MessageKey | null {
  return AVATAR_TYPES.includes(file.type) && file.size <= AVATAR_MAX_BYTES ? null : "valid.photo";
}
