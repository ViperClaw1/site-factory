"use client";

import { useT, type MessageKey } from "@/lib/i18n";
import Link from "next/link";

export interface PillOption {
  label: string;
  value: string;
  // Translated label for fixed taxonomy values; CMS names (collections,
  // characters) fall back to `label` as-is.
  labelKey?: MessageKey;
}

export interface PillGroup {
  key: string; // query param name, e.g. "character", "collection", "category"
  options: PillOption[];
}

export interface CategoryPillsProps {
  groups: PillGroup[];
  activeParams: Record<string, string | undefined>;
  basePath: string;
}

// Filter pills — each one is a plain link to the same page with an updated
// query string, so filters stay shareable/bookmarkable.
export function CategoryPills({ groups, activeParams, basePath }: CategoryPillsProps) {
  const { t } = useT();

  return (
    <div className="flex flex-wrap gap-2">
      {groups.flatMap((group) =>
        group.options.map((option) => {
          const isActive = activeParams[group.key] === option.value;

          // Toggle: re-apply every other active filter, then add/remove this one.
          const params = new URLSearchParams(
            Object.entries(activeParams).filter(
              (entry): entry is [string, string] => Boolean(entry[1])
            )
          );
          if (isActive) {
            params.delete(group.key);
          } else {
            params.set(group.key, option.value);
          }
          const href = params.toString() ? `${basePath}?${params.toString()}` : basePath;

          return (
            <Link
              key={`${group.key}-${option.value}`}
              href={href}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? "bg-ink text-white" : "bg-black/5 text-ink hover:bg-pink-soft hover:text-pink"
              }`}
            >
              {option.labelKey ? t(option.labelKey) : option.label}
            </Link>
          );
        })
      )}
    </div>
  );
}
