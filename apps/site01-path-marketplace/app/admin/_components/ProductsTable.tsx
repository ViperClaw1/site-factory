"use client";

import { statusBadge } from "@/app/admin/_components/StatsCards";
import { ADMIN_PAGE_SIZE, type AdminProductRow } from "@/lib/admin/types";
import { Button } from "@repo/ui";

interface ProductsTableProps {
  rows: AdminProductRow[];
  total: number;
  page: number;
  filteredEmpty: boolean;
  onPage: (page: number) => void;
  onAdd: () => void;
  onBulk: () => void;
  onDelete: (row: AdminProductRow) => void;
}

export function ProductsTable({ rows, total, page, filteredEmpty, onPage, onAdd, onBulk, onDelete }: ProductsTableProps) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-black/15 px-6 py-16 text-center">
        <p className="font-display text-2xl text-ink">{filteredEmpty ? "No products match" : "No products yet"}</p>
        {!filteredEmpty && (
          <div className="mt-4 flex justify-center gap-2">
            <Button type="button" variant="secondary" onClick={onBulk}>
              Bulk upload
            </Button>
            <Button type="button" onClick={onAdd}>
              Add product
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-black/40">
              <th className="p-2"> </th>
              <th className="p-2">Title</th>
              <th className="p-2">Slug</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
              <th className="p-2">Stock</th>
              <th className="p-2">Media</th>
              <th className="p-2">Updated</th>
              <th className="p-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-black/10">
                <td className="p-2">
                  {row.thumbUrl ? (
                    // Admin thumb from Storage; sizing is fixed, so a plain img avoids the optimizer.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.thumbUrl} alt="" className="h-10 w-10 object-cover" />
                  ) : (
                    <span className="block h-10 w-10 bg-black/5" />
                  )}
                </td>
                <td className="p-2 font-medium text-ink">{row.title}</td>
                <td className="p-2 text-black/60">{row.slug}</td>
                <td className="p-2">{row.category.replace(/_/g, " ")}</td>
                <td className="p-2">${row.price.toFixed(2)}</td>
                <td className="p-2">{statusBadge(row.status)}</td>
                <td className="p-2">{row.stock}</td>
                <td className="p-2">{row.mediaCount}</td>
                <td className="p-2 text-black/50">{new Date(row.updatedAt).toLocaleString("en-US")}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center text-black/40 hover:text-pink"
                    aria-label={`Delete ${row.title}`}
                    onClick={() => onDelete(row)}
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <p className="text-black/50">
          Page {page} of {pages}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Previous
          </Button>
          <Button type="button" variant="ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
