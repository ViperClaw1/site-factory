"use client";

import { IMAGE_MAX_BYTES, MAX_MEDIA_FILES, mimeForExtension, STORAGE_PROJECT_LIMIT_BYTES, VIDEO_MAX_BYTES } from "@/lib/admin/schema";
import { useEffect, useMemo, useState } from "react";

export interface MediaItem {
  id: string;
  file: File;
  type: "image" | "video";
  alt: string;
  altTouched: boolean;
  error?: string;
}

interface MediaDropzoneProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  progress?: Record<string, number>;
  disabled?: boolean;
}

function kindOf(file: File): MediaItem["type"] | null {
  const mime = mimeForExtension(file.name);
  if (!mime) return null;
  return mime.startsWith("video/") ? "video" : "image";
}

function problemFor(file: File, type: MediaItem["type"]): string | undefined {
  const limit = type === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > limit) return type === "video" ? "Video must be 200 MB or smaller." : "Image must be 15 MB or smaller.";
  if (file.size === 0) return "File is empty.";
  return undefined;
}

export function MediaDropzone({ items, onChange, progress, disabled }: MediaDropzoneProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const previews = useMemo(() => new Map(items.map((item) => [item.id, URL.createObjectURL(item.file)])), [items]);

  useEffect(() => {
    return () => {
      for (const url of previews.values()) URL.revokeObjectURL(url);
    };
  }, [previews]);

  function addFiles(list: FileList | File[]) {
    const next = [...items];
    const rejected: string[] = [];
    for (const file of list) {
      if (next.length >= MAX_MEDIA_FILES) {
        rejected.push("You can attach up to 20 files.");
        break;
      }
      const type = kindOf(file);
      if (!type) {
        rejected.push(`${file.name} is not a supported image or video.`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${next.length}`,
        file,
        type,
        alt: "",
        altTouched: false,
        error: problemFor(file, type),
      });
    }
    if (rejected.length > 0) setNotice(rejected[0] ?? null);
    else setNotice(null);
    onChange(next);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
  }

  const coverId = items.find((item) => item.type === "image")?.id;

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center text-sm ${
          dragOver ? "border-pink bg-pink-soft" : "border-black/20"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span className="font-semibold text-ink">Drop photos or video</span>
        <span className="mt-1 text-black/50">JPEG, PNG, WebP, AVIF up to 15 MB. MP4 or WebM up to 200 MB.</span>
      </label>
      {notice && (
        <p role="alert" className="mt-2 text-xs text-pink-dark">
          {notice}
        </p>
      )}
      <p className="mt-2 text-xs text-black/45">
        The first image is the cover. Video needs a web-compatible MP4 (H.264/AAC) or WebM — a poster frame is captured
        in the browser. This project&apos;s Storage cap is {Math.round(STORAGE_PROJECT_LIMIT_BYTES / 1024 / 1024)} MB
        until the host limit is raised.
      </p>
      {items.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3">
          {items.map((item, index) => {
            const url = previews.get(item.id);
            const percent = progress?.[item.id];
            return (
              <li
                key={item.id}
                draggable={!disabled}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return;
                  const next = [...items];
                  const [moved] = next.splice(dragIndex, 1);
                  if (!moved) return;
                  next.splice(index, 0, moved);
                  setDragIndex(null);
                  onChange(next);
                }}
                className="border border-black/10 bg-white p-2"
              >
                <div className="relative aspect-square overflow-hidden bg-black/5">
                  {item.type === "image" && url ? (
                    // Local object URL preview; next/image cannot load blob: sources.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={item.alt || item.file.name} className="h-full w-full object-cover" />
                  ) : (
                    url && (
                      <video muted playsInline preload="metadata" src={url} className="h-full w-full object-cover">
                        <track kind="captions" />
                      </video>
                    )
                  )}
                  {item.id === coverId && (
                    <span className="absolute left-1 top-1 bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${item.file.name}`}
                    disabled={disabled}
                    onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-white text-sm text-ink"
                  >
                    ×
                  </button>
                </div>
                <p className="mt-2 truncate text-xs text-black/60" title={item.file.name}>
                  {item.file.name}
                </p>
                {item.error && (
                  <p role="alert" className="mt-1 text-xs text-pink-dark">
                    {item.error}
                  </p>
                )}
                <label className="mt-2 block text-[11px] font-semibold uppercase tracking-wide text-black/40">
                  Alt text
                  <input
                    value={item.alt}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        items.map((entry) =>
                          entry.id === item.id ? { ...entry, alt: event.target.value, altTouched: true } : entry
                        )
                      )
                    }
                    className="mt-1 w-full border border-black/15 px-2 py-1 text-xs font-normal normal-case tracking-normal text-ink"
                  />
                </label>
                <div className="mt-2 flex gap-2">
                  <button type="button" className="text-[11px] font-semibold text-ink/70" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                    Earlier
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-ink/70"
                    disabled={disabled || index === items.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    Later
                  </button>
                </div>
                {typeof percent === "number" && (
                  <div className="mt-2 h-1 bg-black/10" aria-hidden="true">
                    <div className="h-full bg-pink" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
