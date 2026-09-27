"use client";

import { supabaseBrowser } from "@/lib/auth";
import { useT, type MessageKey } from "@/lib/i18n";
import { safeNext } from "@/lib/rbac";
import { validateEmail, validateName, validatePassword } from "@/lib/validation";
import { Container } from "@repo/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { buttonClass } from "./buttons";
import { FormField, INPUT_CLASS } from "./FormField";

type Field = "name" | "email" | "password";

const VALIDATORS: Record<Field, (value: string) => MessageKey | null> = {
  name: validateName,
  email: validateEmail,
  password: validatePassword,
};

export interface AuthFormProps {
  mode: "login" | "signup";
}

// Email + password via Supabase Auth. Temporary: this becomes an email + OTP
// flow later, so the form is kept self-contained and the rest of the app
// only depends on the Supabase session (lib/auth.ts), not on how it was made.
export function AuthForm({ mode }: AuthFormProps) {
  const { t } = useT();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const isSignup = mode === "signup";

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, MessageKey>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Fields the user has left (or all, after a submit attempt). Errors only
  // show for these, then update live on every keystroke.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  const check = (field: Field, value: string) => VALIDATORS[field](value) ?? undefined;

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (touched[field]) setErrors((current) => ({ ...current, [field]: check(field, value) }));
  }

  function blur(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: check(field, values[field]) }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    // Validate before touching Supabase; from here on every field is live.
    const fields: Field[] = isSignup ? ["name", "email", "password"] : ["email", "password"];
    const found = Object.fromEntries(fields.map((f) => [f, check(f, values[f])])) as Partial<Record<Field, MessageKey>>;
    setErrors(found);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    if (Object.values(found).some(Boolean)) return;

    setSubmitting(true);
    const auth = supabaseBrowser().auth;
    const email = values.email.trim();

    if (isSignup) {
      const { data, error } = await auth.signUp({
        email,
        password: values.password,
        options: {
          data: { full_name: values.name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setSubmitting(false);
      if (error) return setFormError(error.message);
      // No session = the project requires email confirmation first.
      if (!data.session) return setCheckEmail(true);
    } else {
      const { error } = await auth.signInWithPassword({ email, password: values.password });
      setSubmitting(false);
      if (error) return setFormError(error.message);
    }

    router.replace(next);
    router.refresh();
  }

  const fieldProps = (field: Field) => ({
    id: field,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(field, event.target.value),
    onBlur: () => blur(field),
    "aria-invalid": !!errors[field],
    "aria-describedby": `${field}-error`,
    className: INPUT_CLASS,
  });

  return (
    <Container className="max-w-md py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">
        {t(isSignup ? "auth.signup.title" : "auth.login.title")}
      </h1>

      {checkEmail ? (
        /* Signup done, waiting on the confirmation link. */
        <p className="mt-8 border-l-4 border-electric bg-electric-soft p-4 text-sm text-ink/80">{t("auth.checkEmail")}</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          {isSignup && (
            <FormField id="name" label={t("auth.name")} error={errors.name && t(errors.name)}>
              <input {...fieldProps("name")} autoComplete="name" />
            </FormField>
          )}
          <FormField id="email" label={t("auth.email")} error={errors.email && t(errors.email)}>
            <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="you@example.com" />
          </FormField>
          <FormField id="password" label={t("auth.password")} error={errors.password && t(errors.password)}>
            <div className="relative">
              <input
                {...fieldProps("password")}
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={`${INPUT_CLASS} pr-12`}
              />
              {/* Show/hide toggle; aria-pressed exposes the state to screen readers. */}
              <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={t(showPassword ? "auth.hidePassword" : "auth.showPassword")}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 mt-2 flex w-12 items-center justify-center text-black/45 transition-colors hover:text-pink"
              >
                <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true" />
              </button>
            </div>
          </FormField>

          {/* Supabase's own message (e.g. "Invalid login credentials"), untranslated. */}
          {formError && (
            <p role="alert" className="border-l-4 border-pink bg-pink-soft p-3 text-xs text-pink-dark">
              {formError}
            </p>
          )}

          <button type="submit" disabled={submitting} className={buttonClass("primary", "lg", "w-full")}>
            {t(isSignup ? "auth.submit.signup" : "auth.submit.login")}
          </button>
        </form>
      )}

      {/* Switch between login and signup, keeping ?next. */}
      <p className="mt-6 text-center text-sm text-black/60">
        <Link
          href={`/${isSignup ? "login" : "signup"}?next=${encodeURIComponent(next)}`}
          className="font-semibold text-pink underline"
        >
          {t(isSignup ? "auth.toLogin" : "auth.toSignup")}
        </Link>
      </p>
    </Container>
  );
}
