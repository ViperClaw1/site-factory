"use client";

import { CoverDropzone } from "@/app/admin/_components/CoverDropzone";
import { BADGES, CATEGORIES, CURRENCIES, INSTRUCTORS, LEVELS, LOCALES, type Lang } from "@/lib/admin/catalog";
import { courseInputSchema, fieldErrorsOf, mimeForExtension } from "@/lib/admin/schema";
import type { LocaleCopy } from "@/lib/admin/types";
import { createSupabaseBrowserClient } from "@repo/lib";
import { Modal } from "@repo/ui";
import { useState } from "react";

const LABEL = "text-xs font-semibold uppercase tracking-wide text-black/45";
const FIELD =
  "admin-field mt-1 block w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#16161a] outline-none [color-scheme:light] focus:border-brand";

const emptyCopy = (): LocaleCopy => ({ title: "", subtitle: "", description: "" });

function moneyLabel(raw: string, currency: string): string {
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) return "";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return "";
  }
}

interface CourseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (slug: string) => void;
}

export function CourseFormModal({ open, onOpenChange, onCreated }: CourseFormModalProps) {
  const [locale, setLocale] = useState<Lang>("en");
  const [copies, setCopies] = useState<Record<string, LocaleCopy>>({ en: emptyCopy() });
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [promo, setPromo] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("USD");
  const [instructorId, setInstructorId] = useState("");
  const [duration, setDuration] = useState("");
  const [badge, setBadge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const copy = copies[locale] ?? emptyCopy();

  function patchCopy(partial: Partial<LocaleCopy>) {
    setCopies((current) => ({ ...current, [locale]: { ...(current[locale] ?? emptyCopy()), ...partial } }));
  }

  function reset() {
    setLocale("en");
    setCopies({ en: emptyCopy() });
    setCategory("");
    setLevel("");
    setTags("");
    setCover(null);
    setPromo("");
    setPrice("");
    setCurrency("USD");
    setInstructorId("");
    setDuration("");
    setBadge("");
    setErrors({});
    setFormError(null);
  }

  async function submit(status: "active" | "draft") {
    if (pending) return;
    setFormError(null);
    const translations = Object.fromEntries(
      Object.entries(copies).filter(([, item]) => item.title.trim() || item.subtitle.trim() || item.description.trim())
    );
    const title = (copies.en ?? Object.values(copies).find((item) => item.title.trim()))?.title.trim() ?? "";
    const draft = {
      slug: "pending",
      translations,
      category,
      level,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      coverPath: "pending/cover.webp",
      promoVideoUrl: promo.trim() || undefined,
      price: Number(price),
      currency,
      instructorId,
      durationMinutes: Number(duration),
      badge: badge || null,
      status,
    };
    const checked = courseInputSchema.safeParse({ ...draft, slug: "course" });
    if (!checked.success || !cover) {
      const next = checked.success ? {} : fieldErrorsOf(checked.error);
      if (!cover) next.coverPath = "Add a cover image.";
      setErrors(next);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const mime = mimeForExtension(cover.name);
      if (!mime) throw new Error("Use JPEG, PNG, WebP, or AVIF.");
      const created = await uploadCourse(title, cover, mime, { ...draft, coverPath: "" });
      reset();
      onOpenChange(false);
      onCreated(created.slug);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the course.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add course" size="lg" className="bg-white text-[#16161a] [color-scheme:light]">
      <form
        className="mt-4 grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit("active");
        }}
      >
        <label className={`${LABEL} lg:col-span-2`}>
          Language
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Lang)}
            className={FIELD}
          >
            {LOCALES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.native}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-black/45">
            Title, subtitle and description are stored separately for each language.
          </span>
        </label>
        <label className={LABEL}>
          Title
          <input value={copy.title} onChange={(event) => patchCopy({ title: event.target.value })} className={FIELD} />
        </label>
        <label className={LABEL}>
          Subtitle
          <input value={copy.subtitle} onChange={(event) => patchCopy({ subtitle: event.target.value })} className={FIELD} />
        </label>
        <label className={`${LABEL} lg:col-span-2`}>
          Description
          <textarea value={copy.description} onChange={(event) => patchCopy({ description: event.target.value })} rows={4} className={FIELD} />
        </label>
        {errors.translations && <p className="text-xs text-red-300 lg:col-span-2">{errors.translations}</p>}
        <label className={LABEL}>
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={FIELD}>
            <option value="">Choose</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {errors.category && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.category}</span>}
        </label>
        <label className={LABEL}>
          Level / grade
          <select value={level} onChange={(event) => setLevel(event.target.value)} className={FIELD}>
            <option value="">Choose</option>
            {LEVELS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          {errors.level && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.level}</span>}
        </label>
        <label className={`${LABEL} lg:col-span-2`}>
          Tags
          <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="python, backend" className={FIELD} />
          {errors.tags && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.tags}</span>}
        </label>
        <div className="lg:col-span-2">
          <p className={LABEL}>Cover image</p>
          <div className="mt-1">
            <CoverDropzone file={cover} onChange={setCover} disabled={pending} error={errors.coverPath} />
          </div>
        </div>
        <label className={`${LABEL} lg:col-span-2`}>
          Promo video URL
          <input value={promo} onChange={(event) => setPromo(event.target.value)} placeholder="https://" className={FIELD} />
          {errors.promoVideoUrl && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.promoVideoUrl}</span>}
        </label>
        <label className={LABEL}>
          Price
          <input
            inputMode="decimal"
            value={price}
            onChange={(event) => setPrice(event.target.value.replace(/[^\d.]/g, ""))}
            className={FIELD}
            aria-describedby="course-price-format"
          />
          <span id="course-price-format" className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-black/45">
            {moneyLabel(price, currency) || "Numbers only"}
          </span>
          {errors.price && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.price}</span>}
        </label>
        <label className={LABEL}>
          Currency
          <select value={currency} onChange={(event) => setCurrency(event.target.value as (typeof CURRENCIES)[number])} className={FIELD}>
            {CURRENCIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Instructor
          <select value={instructorId} onChange={(event) => setInstructorId(event.target.value)} className={FIELD}>
            <option value="">Choose</option>
            {INSTRUCTORS.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          {errors.instructorId && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.instructorId}</span>}
        </label>
        <label className={LABEL}>
          Duration (minutes)
          <input inputMode="numeric" value={duration} onChange={(event) => setDuration(event.target.value.replace(/\D/g, ""))} className={FIELD} />
          {errors.durationMinutes && <span className="mt-1 block text-xs font-normal normal-case text-red-300">{errors.durationMinutes}</span>}
        </label>
        <label className={LABEL}>
          Badge
          <select value={badge} onChange={(event) => setBadge(event.target.value)} className={FIELD}>
            <option value="">None</option>
            {BADGES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {formError && <p className="text-sm text-red-300 lg:col-span-2">{formError}</p>}
        <div className="flex flex-wrap justify-end gap-2 lg:col-span-2">
          <button type="button" disabled={pending} onClick={() => onOpenChange(false)} className="rounded-full px-6 py-3 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-50">
            Cancel
          </button>
          <button type="button" disabled={pending} onClick={() => void submit("draft")} className="rounded-full border border-brand px-6 py-3 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-50">
            Save as draft
          </button>
          <button type="submit" disabled={pending} className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink hover:bg-brand-dark disabled:opacity-50">
            {pending ? "Saving…" : "Publish"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

async function uploadCourse(
  title: string,
  cover: File,
  mime: NonNullable<ReturnType<typeof mimeForExtension>>,
  fields: Record<string, unknown>
): Promise<{ slug: string }> {
  let slug = "";
  let path = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const signed = await fetch("/api/admin/uploads/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, file: { name: cover.name, size: cover.size, mime } }),
    });
    const signBody = (await signed.json()) as { slug?: string; path?: string; token?: string; error?: string };
    if (!signed.ok || !signBody.slug || !signBody.path || !signBody.token) {
      throw new Error(signBody.error === "sign_failed" ? "Could not start the upload." : "Could not sign the cover.");
    }
    slug = signBody.slug;
    path = signBody.path;
    const uploaded = await createSupabaseBrowserClient().storage.from("courses").uploadToSignedUrl(path, signBody.token, cover);
    if (uploaded.error) throw new Error(uploaded.error.message);

    const response = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...fields, slug, coverPath: path }),
    });
    const body = (await response.json()) as { slug?: string; error?: string };
    if (response.status === 409 && attempt === 0) continue;
    if (!response.ok || !body.slug) throw new Error(body.error === "invalid" ? "Check the form and try again." : "Could not create the course.");
    return { slug: body.slug };
  }
  throw new Error("Could not create the course.");
}
