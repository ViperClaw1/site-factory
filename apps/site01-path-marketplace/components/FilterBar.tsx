"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { CategoryPills, type PillGroup } from "./CategoryPills";

export interface FilterBarProps {
  groups: PillGroup[];
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

// Client island: reads/writes the URL's query string directly so filters and
// sort stay shareable/bookmarkable, while the ISR page around it stays server
// rendered.
export function FilterBar({ groups }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeParams = Object.fromEntries(searchParams.entries());

  function handleSortChange(event: ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", event.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <CategoryPills groups={groups} activeParams={activeParams} basePath={pathname} />
      <select
        value={activeParams.sort ?? "newest"}
        onChange={handleSortChange}
        className="rounded-full border border-black/10 bg-transparent px-4 py-1.5 text-xs font-medium"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
