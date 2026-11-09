"use client";

import { Button, Modal } from "@repo/ui";
import { useState } from "react";

// Selected rows on other pages are known only by id, so slug and title are optional.
export interface DeleteTarget {
  id: string;
  slug?: string;
  title?: string;
}

interface DeleteProductDialogProps {
  targets: DeleteTarget[];
  onOpenChange: (open: boolean) => void;
  onFinished: (deletedIds: string[], failed: number, warnings: string[]) => void;
}

export function DeleteProductDialog({ targets, onOpenChange, onFinished }: DeleteProductDialogProps) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(0);
  const single = targets.length === 1 ? targets[0] : null;

  // One request per product through the existing route, so storage cleanup stays per product.
  // ponytail: sequential DELETEs; add a batch endpoint if admins delete hundreds at once.
  async function confirm() {
    if (targets.length === 0 || pending) return;
    setPending(true);
    setDone(0);
    const deleted: string[] = [];
    const warnings: string[] = [];
    let failed = 0;
    for (const target of targets) {
      try {
        const response = await fetch(`/api/admin/products/${target.id}`, { method: "DELETE" });
        const body = (await response.json().catch(() => null)) as { slug?: string; warnings?: string[] } | null;
        // 404 means it is already gone, which is the outcome the admin asked for.
        if (response.ok || response.status === 404) {
          deleted.push(target.id);
          warnings.push(...(body?.warnings ?? []));
        } else failed += 1;
      } catch {
        failed += 1;
      }
      setDone((count) => count + 1);
    }
    setPending(false);
    onFinished(deleted, failed, warnings);
  }

  return (
    <Modal
      open={targets.length > 0}
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open);
      }}
      title={single ? "Delete product?" : `Delete ${targets.length} products?`}
      description={
        single
          ? `“${single.title ?? single.slug ?? "This product"}” will be removed from the catalog, including its files. This cannot be undone.`
          : `${targets.length} products will be removed from the catalog, including their files. This cannot be undone.`
      }
    >
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={pending} onClick={() => void confirm()}>
          {pending ? (single ? "Deleting…" : `Deleting ${done}/${targets.length}…`) : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
