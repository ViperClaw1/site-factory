"use client";

import { supabaseBrowser } from "@/lib/auth";
import { useT, type MessageKey } from "@/lib/i18n";
import { AVATAR_TYPES, validateEmail, validateName, validatePhone, validatePhoto } from "@/lib/validation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { buttonClass } from "./buttons";
import { FormField, INPUT_CLASS } from "./FormField";

type Field = "photo" | "name" | "email" | "phone";

export interface ProfileFormProps {
  userId: string;
  email: string;
  initial: { fullName: string; phone: string; avatarUrl: string | null };
}

// Profile editor: photo (avatars bucket), name + phone (profiles table),
// email (Supabase Auth — a change only applies after the confirmation link).
export function ProfileForm({ userId, email: currentEmail, initial }: ProfileFormProps) {
  const { t } = useT();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.fullName);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState<string | undefined>(initial.phone || undefined);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial.avatarUrl);
  const [errors, setErrors] = useState<Partial<Record<Field, MessageKey>>>({});
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Release the local object URL when the preview changes or on unmount.
  useEffect(() => {
    if (!preview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    const error = validatePhoto(file);
    setErrors((current) => ({ ...current, photo: error ?? undefined }));
    if (error) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    const found: Partial<Record<Field, MessageKey>> = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
    };
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    const supabase = supabaseBrowser();
    try {
      // 1. New photo → upload under "<uid>/", then drop the previous file.
      let avatarUrl = initial.avatarUrl;
      if (photo) {
        const path = `${userId}/${Date.now()}.${photo.type.split("/")[1]}`;
        const upload = await supabase.storage.from("avatars").upload(path, photo, { contentType: photo.type });
        if (upload.error) throw upload.error;
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        const oldPath = initial.avatarUrl?.split("/avatars/")[1];
        if (oldPath) void supabase.storage.from("avatars").remove([oldPath]);
      }

      // 2. Profile row (created on first save).
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, full_name: name.trim(), phone: phone ?? null, avatar_url: avatarUrl });
      if (error) throw error;

      // 3. Email lives in Supabase Auth and needs confirmation.
      const nextEmail = email.trim();
      if (nextEmail !== currentEmail) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: nextEmail },
          { emailRedirectTo: `${window.location.origin}/auth/callback?next=/account` }
        );
        if (emailError) throw emailError;
        setStatus({ kind: "ok", text: t("profile.emailPending", { email: nextEmail }) });
      } else {
        setStatus({ kind: "ok", text: t("profile.saved") });
      }
      setPhoto(null);
      router.refresh();
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-ink md:text-5xl">{t("profile.title")}</h1>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-5">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-black/5">
            {preview ? (
              <Image src={preview} alt="" fill sizes="80px" className="object-cover" unoptimized={preview.startsWith("blob:")} />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <i className="fa-solid fa-user text-2xl text-black/20" aria-hidden="true" />
              </span>
            )}
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className={buttonClass("outline", "sm")}>
              {t("profile.changePhoto")}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_TYPES.join(",")}
              className="hidden"
              aria-label={t("profile.changePhoto")}
              onChange={(event) => pickPhoto(event.target.files?.[0])}
            />
            {errors.photo && (
              <p role="alert" className="mt-1.5 text-xs text-pink-dark">
                {t(errors.photo)}
              </p>
            )}
          </div>
        </div>

        <FormField id="name" label={t("auth.name")} error={errors.name && t(errors.name)}>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField id="email" label={t("auth.email")} error={errors.email && t(errors.email)}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            className={INPUT_CLASS}
          />
        </FormField>

        {/* Country picker + number; the value is always E.164 (+79991234567). */}
        <FormField id="phone" label={t("profile.phone")} error={errors.phone && t(errors.phone)}>
          <PhoneInput
            id="phone"
            international
            value={phone}
            onChange={setPhone}
            autoComplete="tel"
            aria-invalid={!!errors.phone}
            aria-describedby="phone-error"
            className={`${INPUT_CLASS} flex gap-2`}
            numberInputProps={{ className: "flex-1 bg-transparent outline-none" }}
          />
        </FormField>

        {status && (
          <p
            role="status"
            className={`border-l-4 p-3 text-xs ${
              status.kind === "ok" ? "border-electric bg-electric-soft text-ink/80" : "border-pink bg-pink-soft text-pink-dark"
            }`}
          >
            {status.text}
          </p>
        )}

        <button type="submit" disabled={saving} className={buttonClass("primary", "lg", "w-full")}>
          {saving ? t("profile.saving") : t("profile.save")}
        </button>
      </form>

      <button type="button" onClick={signOut} className={buttonClass("outline", "md", "mt-6 w-full")}>
        {t("profile.signOut")}
      </button>
    </div>
  );
}
