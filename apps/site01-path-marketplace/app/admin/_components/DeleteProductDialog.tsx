"use client";

import type { AdminProductRow } from "@/lib/admin/types";
import { Button, Modal } from "@repo/ui";
import { useState } from "react";

interface DeleteProductDialogProps {
  product: AdminProductRow | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (slug: string, warnings: string[]) => void;
  onError: (message: string) => void;
}

export function DeleteProductDialog({ product, onOpenChange, onDeleted, onError }: DeleteProductDialogProps) {
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!product || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { slug?: string; warnings?: string[]; error?: string } | null;
      if (!response.ok || !body?.slug) {
        onError(body?.error === "not_found" ? "This product is already gone." : "Could not delete the product.");
        return;
      }
      onDeleted(body.slug, body.warnings ?? []);
    } catch {
      onError("Could not delete the product.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal
      open={product !== null}
      onOpenChange={(open) => {
        if (!pending) onOpenChange(open);
      }}
      title="Delete product?"
      description={product ? `“${product.title}” will be removed from the catalog, including its files. This cannot be undone.` : undefined}
    >
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="button" disabled={pending} onClick={() => void confirm()}>
          {pending ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
