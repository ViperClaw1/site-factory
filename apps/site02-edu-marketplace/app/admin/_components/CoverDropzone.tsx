"use client";

import { IMAGE_MAX_BYTES, mimeForExtension } from "@/lib/admin/schema";
import { useEffect, useState } from "react";

interface CoverDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  error?: string;
}

export function CoverDropzone({ file, onChange, disabled, error }: CoverDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function take(next: File | undefined) {
    if (!next) return;
    const mime = mimeForExtension(next.name);
    if (!mime) {
      setNotice("Use JPEG, PNG, WebP, or AVIF.");
      return;
    }
    if (next.size > IMAGE_MAX_BYTES) {
      setNotice("Cover must be 15 MB or smaller.");
      return;
    }
    setNotice(null);
    onChange(next);
  }

  return (
    <div>
      <label
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center text-sm text-black/55 ${
          dragOver ? "border-brand bg-brand/10" : "border-black/20 bg-white"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          take(event.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            take(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="mb-3 h-24 w-24 rounded-xl object-cover" />
        ) : null}
        {file ? file.name : "Drop a cover image, or click to choose one"}
      </label>
      {(notice || error) && <p className="mt-2 text-xs text-red-600">{notice || error}</p>}
    </div>
  );
}
