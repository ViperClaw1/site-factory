"use client";

import { buttonClass } from "@/components/buttons";
import { FormField } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";
import { supabaseBrowser, useAuthStore } from "@/lib/auth";
import { useT, type MessageKey } from "@/lib/i18n";
import { validatePassword } from "@/lib/validation";
import { Container } from "@repo/ui";
import Link from "next/link";
import { useState, type FormEvent } from "react";

type Field = "password" | "confirm";

// Step 2 of the reset flow. The emailed link went through /auth/callback,
// which exchanged its code for a (recovery) session — so the user is signed in
// here and updateUser() can set the new password. No session = the link was
// invalid, expired or already used.
export default function ResetPasswordPage() {
  const { t } = useT();
  const { ready, user } = useAuthStore();
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, MessageKey>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const check = (next: typeof values): Partial<Record<Field, MessageKey>> => ({
    password: validatePassword(next.password) ?? undefined,
    confirm: next.confirm === next.password ? undefined : "valid.passwordMatch",
  });

  // Same live-validation behaviour as the auth form: errors appear once a
  // field is left, then update on every keystroke.
  function update(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    const found = check(next);
    setErrors((current) => ({
      password: touched.password ? found.password : current.password,
      confirm: touched.confirm ? found.confirm : current.confirm,
    }));
  }

  function blur(field: Field) {
    setTouched((current) => ({ ...current, [field]: true }));
    setErrors((current) => ({ ...current, [field]: check(values)[field] }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = check(values);
    setErrors(found);
    setTouched({ password: true, confirm: true });
    if (found.password || found.confirm) return;

    setSaving(true);
    setFormError(null);
    const { error } = await supabaseBrowser().auth.updateUser({ password: values.password });
    setSaving(false);
    if (error) return setFormError(error.message);
    setDone(true);
  }

  const fieldProps = (field: Field) => ({
    id: field,
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => update(field, event.target.value),
    onBlur: () => blur(field),
    autoComplete: "new-password",
    "aria-invalid": !!errors[field],
    "aria-describedby": `${field}-error`,
  });

  return (
    <Container className="max-w-md py-14">
      <h1 className="font-display text-4xl text-ink md:text-5xl">{t("reset.new.title")}</h1>

      {!ready ? null : done ? (
        <>
          <p className="mt-8 border-l-4 border-electric bg-electric-soft p-4 text-sm text-ink/80">{t("reset.new.done")}</p>
          <Link href="/" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("confirm.continue")}
          </Link>
        </>
      ) : !user ? (
        <>
          <p role="alert" className="mt-8 border-l-4 border-pink bg-pink-soft p-4 text-sm text-pink-dark">
            {t("reset.new.expired")}
          </p>
          <Link href="/forgot-password" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("reset.request.submit")}
          </Link>
        </>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <FormField id="password" label={t("reset.new.password")} error={errors.password && t(errors.password)}>
            <PasswordInput {...fieldProps("password")} />
          </FormField>
          <FormField id="confirm" label={t("reset.new.confirm")} error={errors.confirm && t(errors.confirm)}>
            <PasswordInput {...fieldProps("confirm")} />
          </FormField>
          {formError && (
            <p role="alert" className="border-l-4 border-pink bg-pink-soft p-3 text-xs text-pink-dark">
              {formError}
            </p>
          )}
          <button type="submit" disabled={saving} className={buttonClass("primary", "lg", "w-full")}>
            {t("reset.new.submit")}
          </button>
        </form>
      )}
    </Container>
  );
}
