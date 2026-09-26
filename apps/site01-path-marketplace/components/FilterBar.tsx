"use client";

import { useT, type MessageKey } from "@/lib/i18n";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { CategoryPills, type PillGroup } from "./CategoryPills";

export interface FilterBarProps {
  groups: PillGroup[];
}

const SORT_OPTIONS: { value: string; key: MessageKey }[] = [
  { value: "newest", key: "sort.newest" },
  { value: "price_asc", key: "sort.price_asc" },
  { value: "price_desc", key: "sort.price_desc" },
];

// Client island: reads/writes the URL's query string directly so filters and
// sort stay shareable/bookmarkable, while the page around it stays server
// rendered.
export function FilterBar({ groups }: FilterBarProps) {
  const { t } = useT();
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
    <div className="flex flex-col gap-4 border-y border-black/5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <CategoryPills groups={groups} activeParams={activeParams} basePath={pathname} />
      <select
        value={activeParams.sort ?? "newest"}
        onChange={handleSortChange}
        className="border-2 border-ink bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-pink"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.key)}
          </option>
        ))}
      </select>
    </div>
  );
}
