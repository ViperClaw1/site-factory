"use client";

import { CheckIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useState, type InputHTMLAttributes } from "react";
import { PASSWORD_RULES, type PasswordRule } from "../validation";

// Shared form pieces for the auth screens (login, signup, forgot/reset password).

export const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-brand aria-[invalid=true]:border-red-400";

export const PRIMARY_BUTTON_CLASS =
  "h-12 w-full rounded-full bg-brand text-sm font-bold text-ink transition hover:bg-brand-dark disabled:opacity-60";

export const AUTH_SECTION_CLASS = "mx-auto w-full max-w-md px-4 py-16 sm:py-24";

// Inline error slot; always rendered (min-height) so the layout doesn't jump.
export function FieldError({ id, message }: { id: string; message: string | null | false | undefined }) {
  return (
    <p id={id} role="alert" className="mt-1.5 min-h-[1rem] text-xs text-red-300">
      {message || null}
    </p>
  );
}

// Supabase / request-level error box.
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-300">
      {message}
    </p>
  );
}

// Success / "check your inbox" box.
export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mt-8 rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-white/85">
      {children}
    </p>
  );
}

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
  id: string;
  label: string;
  value: string;
  error?: string | null | false;
  // Show the live password-policy checklist (new passwords only).
  showRules?: boolean;
  // Optional right-aligned slot next to the label (e.g. "Forgot password?").
  labelExtra?: React.ReactNode;
}

// Password input with show/hide toggle, inline error and optional policy checklist.
export function PasswordField({ id, label, value, error, showRules, labelExtra, ...inputProps }: PasswordFieldProps) {
  const { t } = useI18n();
  const a = t.auth;
  const [shown, setShown] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-white/80">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          name={id}
          value={value}
          type={shown ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={`${id}-error`}
          className={`${INPUT_CLASS} pr-12`}
        />
        {/* Show/hide toggle; aria-pressed exposes the state to screen readers. */}
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? a.hidePassword : a.showPassword}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/45 transition hover:text-brand"
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      <FieldError id={`${id}-error`} message={error} />

      {/* Live password-policy checklist. */}
      {showRules && (
        <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => {
            const ok = PASSWORD_RULES[rule](value);
            return (
              <li key={rule} className={`flex items-center gap-1.5 ${ok ? "text-emerald-400" : "text-white/45"}`}>
                <CheckIcon className={`h-3.5 w-3.5 ${ok ? "" : "opacity-30"}`} />
                {a.rules[rule]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
