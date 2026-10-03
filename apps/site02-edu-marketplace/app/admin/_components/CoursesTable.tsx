"use client";

import { statusBadge } from "@/app/admin/_components/StatsCards";
import { ADMIN_PAGE_SIZE, type AdminCourseRow } from "@/lib/admin/types";

interface CoursesTableProps {
  rows: AdminCourseRow[];
  total: number;
  page: number;
  filteredEmpty: boolean;
  onPage: (page: number) => void;
  onAdd: () => void;
  onDelete: (row: AdminCourseRow) => void;
}

function money(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function CoursesTable({ rows, total, page, filteredEmpty, onPage, onAdd, onDelete }: CoursesTableProps) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-16 text-center">
        <p className="font-heading text-2xl font-extrabold text-[#16161a]">{filteredEmpty ? "No courses match" : "No courses yet"}</p>
        {!filteredEmpty && (
          <button type="button" onClick={onAdd} className="mt-4 rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink hover:bg-brand-dark">
            Add course
          </button>
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
              <th className="p-2">Language</th>
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
                  {row.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.coverUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="block h-10 w-10 rounded-lg bg-black/5" />
                  )}
                </td>
                <td className="p-2 font-medium text-[#16161a]">{row.title}</td>
                <td className="p-2 text-black/60">{row.slug}</td>
                <td className="p-2">{row.category}</td>
                <td className="p-2">{money(row.price, row.currency)}</td>
                <td className="p-2">{statusBadge(row.status)}</td>
                <td className="p-2 uppercase">{row.language}</td>
                <td className="p-2 text-black/50">{new Date(row.updatedAt).toLocaleString("en-US")}</td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center text-black/40 hover:text-brand"
                    aria-label={`Delete ${row.title}`}
                    onClick={() => onDelete(row)}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-full px-6 py-3 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-40">
            Previous
          </button>
          <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="rounded-full px-6 py-3 text-sm font-medium text-brand hover:bg-brand/10 disabled:opacity-40">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
