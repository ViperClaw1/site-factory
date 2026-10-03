"use client";

import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { Button } from "@repo/ui";
import { useState } from "react";

export interface AdminFilters {
  category: string;
  status: string;
  q: string;
}

interface AdminToolbarProps {
  filters: AdminFilters;
  onChange: (filters: AdminFilters) => void;
  onAdd: () => void;
  onBulk: () => void;
}

export function AdminToolbar({ filters, onChange, onAdd, onBulk }: AdminToolbarProps) {
  const [query, setQuery] = useState(filters.q);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-black/45">
        Category
        <select
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
          className="mt-1 block border-2 border-black/15 px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
        >
          <option value="">All</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold uppercase tracking-wide text-black/45">
        Status
        <select
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
          className="mt-1 block border-2 border-black/15 px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
        >
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
        <label className="text-xs font-semibold uppercase tracking-wide text-black/45">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Title or slug"
            className="mt-1 block border-2 border-black/15 px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
          />
        </label>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>
      <div className="ml-auto flex gap-2">
        <Button type="button" variant="secondary" onClick={onBulk}>
          Bulk upload
        </Button>
        <Button type="button" onClick={onAdd}>
          Add product
        </Button>
      </div>
    </div>
  );
}
