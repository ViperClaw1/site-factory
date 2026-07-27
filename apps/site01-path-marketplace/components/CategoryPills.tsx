import Link from "next/link";

export interface PillOption {
  label: string;
  value: string;
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

// Server-rendered filter pills — each one is a plain link to the same page
// with an updated query string, so filtering works with no client JS.
export function CategoryPills({ groups, activeParams, basePath }: CategoryPillsProps) {
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
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                  : "border-black/10 text-black/70 hover:border-[var(--color-primary)]"
              }`}
            >
              {option.label}
            </Link>
          );
        })
      )}
    </div>
  );
}
