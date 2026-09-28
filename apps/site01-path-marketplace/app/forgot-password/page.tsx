"use client";

import { buttonClass } from "@/components/buttons";
import { FormField, INPUT_CLASS } from "@/components/FormField";
import { supabaseBrowser } from "@/lib/auth";
import { useT, type MessageKey } from "@/lib/i18n";
import { validateEmail } from "@/lib/validation";
import { Container } from "@repo/ui";
import Link from "next/link";
import { useState, type FormEvent } from "react";

// Step 1 of the reset flow: email → Supabase sends a recovery link that
// returns via /auth/callback (code → session) to /reset-password.
export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<MessageKey | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateEmail(email);
    setError(found);
    if (found) return;

    setSending(true);
    setFormError(null);
    const address = email.trim();
    const { error: sendError } = await supabaseBrowser().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setSending(false);
    // Same confirmation whether or not the account exists (no email enumeration);
    // only real failures (e.g. rate limit) are shown.
    if (sendError) return setFormError(sendError.message);
    setSentTo(address);
  }

  return (
    <Container className="max-w-md py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{t("reset.request.title")}</h1>

      {sentTo ? (
        <p className="mt-8 border-l-4 border-electric bg-electric-soft p-4 text-sm text-ink/80">
          {t("reset.request.sent", { email: sentTo })}
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <p className="text-sm text-black/60">{t("reset.request.body")}</p>
          <FormField id="email" label={t("auth.email")} error={error && t(error)}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(validateEmail(event.target.value)); // live once shown
              }}
              onBlur={() => setError(validateEmail(email))}
              aria-invalid={!!error}
              aria-describedby="email-error"
              className={INPUT_CLASS}
            />
          </FormField>
          {formError && (
            <p role="alert" className="border-l-4 border-pink bg-pink-soft p-3 text-xs text-pink-dark">
              {formError}
            </p>
          )}
          <button type="submit" disabled={sending} className={buttonClass("primary", "lg", "w-full")}>
            {t("reset.request.submit")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-semibold text-pink underline">
          {t("reset.back")}
        </Link>
      </p>
    </Container>
  );
}
