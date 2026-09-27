"use client";

import { CheckIcon, EyeIcon, EyeOffIcon, GoogleIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn, signInWithGoogle, signUp } from "../api";
import {
  PASSWORD_RULES,
  safeNext,
  validateEmail,
  validatePassword,
  type AuthErrorKey,
  type PasswordRule,
} from "../validation";

type Field = "email" | "password";

const INPUT_CLASS =
  "h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-brand aria-[invalid=true]:border-red-400";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useI18n();
  const a = t.auth;
  const router = useRouter();
  const params = useSearchParams();
  const isSignup = mode === "signup";
  const requestedNext = params.get("next");
  // An explicit ?next wins; otherwise signup → profile, login → home.
  // Also applies to Google, keyed on which page the button was pressed on.
  const next = safeNext(requestedNext, isSignup ? "/account" : "/");

  const [values, setValues] = useState({ email: "", password: "" });
  // Fields the user has left (or all, after a submit attempt). Errors only
  // show for these, then update live on every keystroke.
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  // Supabase's own message, or the callback's ?error=oauth.
  const [formError, setFormError] = useState<string | null>(params.get("error") === "oauth" ? a.errors.oauth : null);

  const errors: Record<Field, AuthErrorKey | null> = {
    email: validateEmail(values.email),
    password: validatePassword(values.password, isSignup),
  };
  const shownError = (field: Field) => (touched[field] ? errors[field] : null);

  const update = (field: Field, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const blur = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setTouched({ email: true, password: true });
    if (errors.email || errors.password) return;

    setSubmitting(true);
    const email = values.email.trim();
    const { data, error } = isSignup
      ? await signUp(email, values.password, next)
      : await signIn(email, values.password);
    setSubmitting(false);
    if (error) return setFormError(error.message);
    // Signup with no session = the project requires email confirmation first.
    if (!data.session) return setCheckEmail(true);

    router.replace(next);
    router.refresh();
  }

  async function handleGoogle() {
    setFormError(null);
    setSubmitting(true);
    const { error } = await signInWithGoogle(next);
    // On success the browser is already navigating to Google.
    if (error) {
      setSubmitting(false);
      setFormError(error.message);
    }
  }

  const fieldProps = (field: Field) => ({
    id: field,
    name: field,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(field, event.target.value),
    onBlur: () => blur(field),
    "aria-invalid": !!shownError(field),
    "aria-describedby": `${field}-error`,
  });

  return (
    <section className="mx-auto w-full max-w-md px-4 py-16 sm:py-24">
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{isSignup ? a.signupTitle : a.loginTitle}</h1>
      <p className="mt-2 text-sm text-white/60">{isSignup ? a.signupSubtitle : a.loginSubtitle}</p>

      {checkEmail ? (
        /* Signup done, waiting on the confirmation link. */
        <p role="status" className="mt-8 rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-white/85">
          {a.checkEmail}
        </p>
      ) : (
        <>
          {/* ---- Google OAuth ---- */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white text-sm font-semibold text-ink transition hover:bg-white/90 disabled:opacity-60"
          >
            <GoogleIcon />
            {a.google}
          </button>

          <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-widest text-white/35">
            <span className="h-px flex-1 bg-white/10" />
            {a.or}
            <span className="h-px flex-1 bg-white/10" />
          </div>

          {/* ---- Email + password ---- */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                {a.email}
              </label>
              <input {...fieldProps("email")} type="email" autoComplete="email" placeholder="you@example.com" className={INPUT_CLASS} />
              <FieldError id="email-error" message={shownError("email") && a.errors[shownError("email")!]} />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                {a.password}
              </label>
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
                  aria-label={showPassword ? a.hidePassword : a.showPassword}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center text-white/45 transition hover:text-brand"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <FieldError id="password-error" message={shownError("password") && a.errors[shownError("password")!]} />

              {/* Live password-policy checklist (signup only). */}
              {isSignup && (
                <ul className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                  {(Object.keys(PASSWORD_RULES) as PasswordRule[]).map((rule) => {
                    const ok = PASSWORD_RULES[rule](values.password);
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

            {formError && (
              <p role="alert" className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-xs text-red-300">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-brand text-sm font-bold text-ink transition hover:bg-brand-dark disabled:opacity-60"
            >
              {isSignup ? a.submitSignup : a.submitLogin}
            </button>
          </form>
        </>
      )}

      {/* Switch between login and signup, forwarding ?next if one was given. */}
      <p className="mt-6 text-center text-sm text-white/60">
        {isSignup ? a.haveAccount : a.noAccount}{" "}
        <Link
          href={`/${isSignup ? "login" : "signup"}${requestedNext ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-brand hover:underline"
        >
          {isSignup ? a.toLogin : a.toSignup}
        </Link>
      </p>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string | null | false }) {
  return (
    <p id={id} role="alert" className="mt-1.5 min-h-[1rem] text-xs text-red-300">
      {message || null}
    </p>
  );
}
