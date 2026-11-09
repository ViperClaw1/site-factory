"use client";

import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { Button } from "@repo/ui";
import { useEffect, useRef, useState } from "react";

const SEARCH_DEBOUNCE_MS = 200;

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
  selectedCount: number;
  exporting: boolean;
  onExportSelected: () => void;
  onExportAll: () => void;
  onDeleteSelected: () => void;
}

export function AdminToolbar({ filters, onChange, onAdd, onBulk, selectedCount, exporting, onExportSelected, onExportAll, onDeleteSelected }: AdminToolbarProps) {
  const [query, setQuery] = useState(filters.q);
  const filtered = Boolean(filters.category || filters.status || filters.q);

  // Live search: apply the query once typing pauses, skipping no-op navigations.
  // ponytail: refs keep the effect keyed on `query` only; the latest filters/onChange are read at fire time.
  const latest = useRef({ filters, onChange });
  latest.current = { filters, onChange };
  useEffect(() => {
    const timer = setTimeout(() => {
      const { filters: current, onChange: apply } = latest.current;
      if (query.trim() !== current.q.trim()) apply({ ...current, q: query.trim() });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

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
      <label className="text-xs font-semibold uppercase tracking-wide text-black/45">
        Search
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Title or slug"
          className="mt-1 block border-2 border-black/15 px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
        />
      </label>
      <div className="ml-auto flex flex-wrap gap-2">
        {selectedCount > 0 && (
          <Button type="button" variant="secondary" onClick={onDeleteSelected}>
            Delete rows ({selectedCount})
          </Button>
        )}
        {selectedCount > 0 && (
          <Button type="button" variant="secondary" disabled={exporting} onClick={onExportSelected}>
            Export selected ({selectedCount})
          </Button>
        )}
        <Button type="button" variant="secondary" disabled={exporting} onClick={onExportAll}>
          {filtered ? "Export filtered" : "Export all"}
        </Button>
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
