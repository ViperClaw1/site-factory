"use client";

import { supabaseBrowser } from "@/lib/auth";
import {
  ALLOWED_MIME_TYPES,
  mimeForExtension,
  type ProductFields,
} from "@/lib/admin/schema";
import type { UploadPhase } from "@/lib/admin/types";
import { captureVideoPoster } from "@/lib/admin/video-poster";
import { useRef, useState } from "react";

export interface LocalMedia {
  id: string;
  file: File;
  type: "image" | "video";
  alt: string;
}

export interface QueueJob {
  id: string;
  fields: ProductFields;
  media: LocalMedia[];
  onFile?: (fileId: string, progress: number) => void;
}

export interface QueueState {
  id: string;
  status: UploadPhase;
  error?: string;
  fieldErrors?: Record<string, string>;
  slug?: string;
  warnings?: string[];
}

export class UploadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string>
  ) {
    super(message);
  }
}

function fileMime(file: File): (typeof ALLOWED_MIME_TYPES)[number] | null {
  const fromName = mimeForExtension(file.name);
  if (fromName) return fromName;
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)
    ? (file.type as (typeof ALLOWED_MIME_TYPES)[number])
    : null;
}

async function postAdmin(url: string, body: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: response.status, data };
}

function explain(data: Record<string, unknown>, fallback: string): string {
  const error = typeof data.error === "string" ? data.error : fallback;
  if (error === "slug_taken") return "That slug was just taken.";
  if (error === "invalid") return "Check the highlighted fields.";
  if (error === "unauthorized") return "Sign in as an admin.";
  return error;
}

async function uploadSigned(bucket: string, path: string, token: string, file: File, mime: string): Promise<void> {
  const { error } = await supabaseBrowser().storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw new UploadRequestError(error.message, 400);
}

export async function submitProduct(
  fields: ProductFields,
  media: LocalMedia[],
  onFile?: (fileId: string, progress: number) => void,
  onPhase?: (phase: "uploading" | "processing") => void
): Promise<{ id: string; slug: string; warnings: string[] }> {
  const posters = new Map<string, File>();
  for (const item of media) {
    if (item.type !== "video") continue;
    onFile?.(item.id, 5);
    const blob = await captureVideoPoster(item.file);
    posters.set(item.id, new File([blob], `${item.id}.poster`, { type: blob.type || "image/webp" }));
  }

  let slug = fields.slug;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const files = [
      ...media.map((item) => {
        const mime = fileMime(item.file);
        if (!mime) throw new UploadRequestError(`${item.file.name} must be JPEG, PNG, WebP, AVIF, MP4, or WebM.`, 400);
        return { name: `media:${item.id}`, size: item.file.size, mime, role: "media" as const };
      }),
      ...[...posters.entries()].map(([id, file]) => ({
        name: `poster:${id}`,
        size: file.size,
        mime: (file.type || "image/webp") as (typeof ALLOWED_MIME_TYPES)[number],
        role: "poster" as const,
      })),
    ];

    onPhase?.("uploading");
    const signed = await postAdmin("/api/admin/uploads/sign", {
      category: fields.category,
      slug,
      title: fields.title,
      character: fields.character,
      files,
    });
    if (signed.status !== 200) {
      const fieldErrors = signed.data.fieldErrors as Record<string, string> | undefined;
      throw new UploadRequestError(explain(signed.data, "Could not start the upload."), signed.status, fieldErrors);
    }

    slug = String(signed.data.slug);
    const bucket = String(signed.data.bucket);
    const uploads = signed.data.uploads as { name: string; path: string; token: string }[];
    const byName = new Map(uploads.map((item) => [item.name, item]));

    for (const item of media) {
      const slot = byName.get(`media:${item.id}`);
      const mime = fileMime(item.file);
      if (!slot || !mime) throw new UploadRequestError(`Missing an upload slot for ${item.file.name}.`, 400);
      onFile?.(item.id, 40);
      await uploadSigned(bucket, slot.path, slot.token, item.file, mime);
      const poster = posters.get(item.id);
      if (poster) {
        const posterSlot = byName.get(`poster:${item.id}`);
        if (!posterSlot) throw new UploadRequestError(`Missing a poster slot for ${item.file.name}.`, 400);
        await uploadSigned(bucket, posterSlot.path, posterSlot.token, poster, poster.type || "image/webp");
      }
      onFile?.(item.id, 100);
    }

    onPhase?.("processing");
    const created = await postAdmin("/api/admin/products", {
      ...fields,
      slug,
      media: media.map((item) => ({
        path: byName.get(`media:${item.id}`)?.path,
        type: item.type,
        alt: item.alt || fields.title,
        posterPath: item.type === "video" ? byName.get(`poster:${item.id}`)?.path : undefined,
      })),
    });

    if (created.status === 409 && attempt === 0) continue;
    if (created.status !== 201) {
      const fieldErrors = created.data.fieldErrors as Record<string, string> | undefined;
      throw new UploadRequestError(explain(created.data, "Could not save the product."), created.status, fieldErrors);
    }
    return {
      id: String(created.data.id),
      slug: String(created.data.slug),
      warnings: Array.isArray(created.data.warnings) ? (created.data.warnings as string[]) : [],
    };
  }

  throw new UploadRequestError("That slug was just taken.", 409);
}

export function useUploadQueue() {
  const [states, setStates] = useState<QueueState[]>([]);
  const [running, setRunning] = useState(false);
  const statesRef = useRef<QueueState[]>([]);
  const jobsRef = useRef<QueueJob[]>([]);

  function update(id: string, patch: Partial<QueueState>) {
    statesRef.current = statesRef.current.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setStates(statesRef.current);
  }

  async function run(jobs: QueueJob[], concurrency: number) {
    const pending = [...jobs];
    const workers = Array.from({ length: Math.max(1, Math.min(concurrency, pending.length)) }, async () => {
      for (;;) {
        const job = pending.shift();
        if (!job) return;
        update(job.id, { status: "uploading", error: undefined, fieldErrors: undefined });
        try {
          const result = await submitProduct(job.fields, job.media, job.onFile, (phase) => {
            if (phase === "processing") update(job.id, { status: "processing" });
          });
          update(job.id, { status: "done", slug: result.slug, warnings: result.warnings });
        } catch (err) {
          const requestError = err instanceof UploadRequestError ? err : null;
          update(job.id, {
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed.",
            fieldErrors: requestError?.fieldErrors,
          });
        }
      }
    });
    await Promise.all(workers);
  }

  async function start(jobs: QueueJob[], concurrency = 3): Promise<QueueState[]> {
    jobsRef.current = jobs;
    statesRef.current = jobs.map((job) => ({ id: job.id, status: "queued" }));
    setStates(statesRef.current);
    setRunning(true);
    try {
      await run(jobs, concurrency);
      return statesRef.current;
    } finally {
      setRunning(false);
    }
  }

  async function retryFailed(concurrency = 3): Promise<QueueState[]> {
    const failed = new Set(statesRef.current.filter((item) => item.status === "error").map((item) => item.id));
    const jobs = jobsRef.current.filter((job) => failed.has(job.id));
    if (jobs.length === 0) return statesRef.current;
    setRunning(true);
    try {
      for (const job of jobs) update(job.id, { status: "queued", error: undefined });
      await run(jobs, concurrency);
      return statesRef.current;
    } finally {
      setRunning(false);
    }
  }

  return { states, running, start, retryFailed };
}
