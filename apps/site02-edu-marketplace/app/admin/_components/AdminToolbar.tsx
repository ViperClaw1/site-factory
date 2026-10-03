"use client";

import { CATEGORIES } from "@/lib/admin/catalog";
import { useState } from "react";

export interface AdminFilters {
  category: string;
  status: string;
  q: string;
}

const LABEL = "text-xs font-semibold uppercase tracking-wide text-black/45";
const CONTROL =
  "admin-field mt-1 block rounded-xl border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-[#16161a] [color-scheme:light]";

interface AdminToolbarProps {
  filters: AdminFilters;
  onChange: (filters: AdminFilters) => void;
  onAdd: () => void;
}

export function AdminToolbar({ filters, onChange, onAdd }: AdminToolbarProps) {
  const [query, setQuery] = useState(filters.q);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className={LABEL}>
        Category
        <select value={filters.category} onChange={(event) => onChange({ ...filters, category: event.target.value })} className={CONTROL}>
          <option value="">All</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label className={LABEL}>
        Status
        <select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })} className={CONTROL}>
          <option value="">All</option>
          <option value="active">active</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
      </label>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ ...filters, q: query });
        }}
      >
        <label className={LABEL}>
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or slug" className={CONTROL} />
        </label>
        <button type="submit" className="rounded-full bg-[#111] px-6 py-3 text-sm font-medium text-yellow-400 hover:bg-[#222]">
          Search
        </button>
      </form>
      <div className="ml-auto flex gap-2">
        <button type="button" onClick={onAdd} className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-ink hover:bg-brand-dark">
          Add course
        </button>
      </div>
    </div>
  );
}
