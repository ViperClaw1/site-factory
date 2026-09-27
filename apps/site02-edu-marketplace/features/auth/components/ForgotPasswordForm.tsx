"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "../api";
import { validateEmail } from "../validation";
import { AUTH_SECTION_CLASS, FieldError, FormError, INPUT_CLASS, Notice, PRIMARY_BUTTON_CLASS } from "./fields";

// Step 1 of the reset flow: ask for the email and send the recovery link.
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const a = t.auth;
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errorKey = touched ? validateEmail(email) : null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setTouched(true);
    if (validateEmail(email)) return;

    setSubmitting(true);
    const { error } = await requestPasswordReset(email.trim());
    setSubmitting(false);
    // Supabase doesn't reveal whether the email exists; errors here are
    // rate limits / network, so they're worth showing.
    if (error) return setFormError(error.message);
    setSent(true);
  }

  return (
    <section className={AUTH_SECTION_CLASS}>
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{a.forgotTitle}</h1>
      <p className="mt-2 text-sm text-white/60">{a.forgotSubtitle}</p>

      {sent ? (
        /* Same message whether or not the account exists (no user enumeration). */
        <Notice>{a.resetSent}</Notice>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={!!errorKey}
              aria-describedby="email-error"
              className={INPUT_CLASS}
            />
            <FieldError id="email-error" message={errorKey && a.errors[errorKey]} />
          </div>

          <FormError message={formError} />

          <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
            {a.sendResetLink}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-brand hover:underline">
          {a.backToLogin}
        </Link>
      </p>
    </section>
  );
}
