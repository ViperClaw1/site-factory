"use client";

import type { AdminCourseRow } from "@/lib/admin/types";
import { Modal } from "@repo/ui";
import { useState } from "react";

interface DeleteCourseDialogProps {
  course: AdminCourseRow | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string, slug: string) => void;
  onError: (message: string) => void;
}

export function DeleteCourseDialog({ course, onOpenChange, onDeleted, onError }: DeleteCourseDialogProps) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!course || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { slug?: string; error?: string } | null;
      if (response.status === 404) {
        onDeleted(course.id, course.slug);
        return;
      }
      if (!response.ok || !body?.slug) {
        onError("Could not delete the course.");
        return;
      }
      onDeleted(course.id, body.slug);
    } catch {
      onError("Could not delete the course.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={course !== null}
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open);
      }}
      title="Delete course?"
      className="bg-white text-[#16161a] [color-scheme:light]"
    >
      <p className="mt-2 text-sm text-black/60">
        {course ? `“${course.title}” will be removed from the catalog, including its cover. This cannot be undone.` : ""}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" disabled={pending} onClick={() => onOpenChange(false)} className="rounded-full px-6 py-3 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-50">
          Cancel
        </button>
        <button type="button" disabled={pending} onClick={() => void confirm()} className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink hover:bg-brand-dark disabled:opacity-50">
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
