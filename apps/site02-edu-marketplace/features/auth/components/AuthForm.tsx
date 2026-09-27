"use client";

import { GoogleIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signIn, signInWithGoogle, signUp } from "../api";
import { safeNext, validateEmail, validatePassword, type AuthErrorKey } from "../validation";
import {
  AUTH_SECTION_CLASS,
  FieldError,
  FormError,
  INPUT_CLASS,
  Notice,
  PasswordField,
  PRIMARY_BUTTON_CLASS,
} from "./fields";

type Field = "email" | "password";

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
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  // Supabase's own message, or the callback's ?error=oauth.
  const [formError, setFormError] = useState<string | null>(params.get("error") === "oauth" ? a.errors.oauth : null);

  const errors: Record<Field, AuthErrorKey | null> = {
    email: validateEmail(values.email),
    password: validatePassword(values.password, isSignup),
  };
  const shownError = (field: Field) => {
    const key = touched[field] && errors[field];
    return key ? a.errors[key] : null;
  };

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

  return (
    <section className={AUTH_SECTION_CLASS}>
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{isSignup ? a.signupTitle : a.loginTitle}</h1>
      <p className="mt-2 text-sm text-white/60">{isSignup ? a.signupSubtitle : a.loginSubtitle}</p>

      {checkEmail ? (
        /* Signup done, waiting on the confirmation link. */
        <Notice>{a.checkEmail}</Notice>
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
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                onBlur={() => blur("email")}
                aria-invalid={!!shownError("email")}
                aria-describedby="email-error"
                className={INPUT_CLASS}
              />
              <FieldError id="email-error" message={shownError("email")} />
            </div>

            <PasswordField
              id="password"
              label={a.password}
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              onBlur={() => blur("password")}
              error={shownError("password")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              showRules={isSignup}
              labelExtra={
                !isSignup && (
                  <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                    {a.forgotLink}
                  </Link>
                )
              }
            />

            <FormError message={formError} />

            <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
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
