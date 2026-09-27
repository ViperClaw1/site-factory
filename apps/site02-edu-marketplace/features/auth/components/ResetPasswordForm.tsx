"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updatePassword } from "../api";
import { useUser } from "../hooks";
import { validatePassword } from "../validation";
import { AUTH_SECTION_CLASS, FormError, Notice, PasswordField, PRIMARY_BUTTON_CLASS } from "./fields";

type Field = "password" | "confirm";

// Step 2 of the reset flow. The recovery link (via /auth/callback) has already
// signed the user in; here they pick a new password. No session = the link
// was invalid, expired or already used.
export function ResetPasswordForm() {
  const { t } = useI18n();
  const a = t.auth;
  const router = useRouter();
  const { user, ready } = useUser();

  const [values, setValues] = useState({ password: "", confirm: "" });
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors: Record<Field, string | null> = {
    password: (() => {
      const key = validatePassword(values.password, true);
      return key && a.errors[key];
    })(),
    confirm: values.confirm === values.password ? null : a.errors.passwordMismatch,
  };
  const shownError = (field: Field) => (touched[field] ? errors[field] : null);

  const update = (field: Field, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const blur = (field: Field) => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setTouched({ password: true, confirm: true });
    if (errors.password || errors.confirm) return;

    setSubmitting(true);
    const { error } = await updatePassword(values.password);
    setSubmitting(false);
    if (error) return setFormError(error.message);

    router.replace("/account");
    router.refresh();
  }

  // Wait for the session before choosing between the form and "link expired".
  if (!ready) return <section className={AUTH_SECTION_CLASS} />;

  return (
    <section className={AUTH_SECTION_CLASS}>
      <h1 className="font-heading text-3xl font-extrabold sm:text-4xl">{a.resetTitle}</h1>

      {!user ? (
        <>
          <Notice>{a.resetLinkInvalid}</Notice>
          <p className="mt-6 text-center text-sm">
            <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
              {a.sendResetLink}
            </Link>
          </p>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <PasswordField
            id="password"
            label={a.newPassword}
            value={values.password}
            onChange={(event) => update("password", event.target.value)}
            onBlur={() => blur("password")}
            error={shownError("password")}
            autoComplete="new-password"
            showRules
          />
          <PasswordField
            id="confirm"
            label={a.confirmPassword}
            value={values.confirm}
            onChange={(event) => update("confirm", event.target.value)}
            onBlur={() => blur("confirm")}
            error={shownError("confirm")}
            autoComplete="new-password"
          />

          <FormError message={formError} />

          <button type="submit" disabled={submitting} className={PRIMARY_BUTTON_CLASS}>
            {a.saveNewPassword}
          </button>
        </form>
      )}
    </section>
  );
}
