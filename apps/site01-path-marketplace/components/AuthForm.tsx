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
import { PasswordInput } from "./PasswordInput";

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
  const isSignup = mode === "signup";
  // An explicit ?next (e.g. middleware bouncing a guest off /account) wins;
  // otherwise login → home, signup → profile page.
  const requestedNext = useSearchParams().get("next");
  const next = safeNext(requestedNext, isSignup ? "/account" : "/");

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, MessageKey>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Google OAuth: Supabase redirects to Google and back to its own
  // /auth/v1/callback, then on to our /auth/callback (which exchanges the
  // code for a session cookie) and finally ?next — same destination rules as
  // the email flow. A new Google user is created on the fly, so this button
  // covers both login and signup.
  async function signInWithGoogle() {
    setFormError(null);
    setSubmitting(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setSubmitting(false);
      setFormError(error.message);
    }
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
        <>
        {/* Google OAuth, then an "or" divider before the email form. */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={submitting}
          className={buttonClass("outline", "lg", "mt-8 w-full normal-case tracking-normal")}
        >
          <i className="fa-brands fa-google text-base" aria-hidden="true" />
          {t("auth.google")}
        </button>
        <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-black/40" aria-hidden="true">
          <span className="h-px flex-1 bg-black/10" />
          {t("auth.or")}
          <span className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {isSignup && (
            <FormField id="name" label={t("auth.name")} error={errors.name && t(errors.name)}>
              <input {...fieldProps("name")} autoComplete="name" />
            </FormField>
          )}
          <FormField id="email" label={t("auth.email")} error={errors.email && t(errors.email)}>
            <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="you@example.com" />
          </FormField>
          <FormField
            id="password"
            label={t("auth.password")}
            error={errors.password && t(errors.password)}
            labelAction={
              !isSignup && (
                <Link href="/forgot-password" className="text-xs font-semibold text-pink hover:underline">
                  {t("auth.forgot")}
                </Link>
              )
            }
          >
            <PasswordInput
              {...fieldProps("password")}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
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
        </>
      )}

      {/* Switch between login and signup, forwarding ?next only if one was
          given — so each mode keeps its own default destination. */}
      <p className="mt-6 text-center text-sm text-black/60">
        <Link
          href={`/${isSignup ? "login" : "signup"}${requestedNext ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-pink underline"
        >
          {t(isSignup ? "auth.toLogin" : "auth.toSignup")}
        </Link>
      </p>
    </Container>
  );
}
