import { CATEGORIES } from "@/lib/admin/catalog";
import type { AdminStats } from "@/lib/admin/types";
import type { CourseStatus } from "@repo/types";

export function StatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    ["Total", stats.total],
    ["Active", stats.byStatus.active],
    ["Draft", stats.byStatus.draft],
    ["Archived", stats.byStatus.archived],
    ...CATEGORIES.map((category) => [category, stats.byCategory[category] ?? 0] as const),
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
          <p className="mt-1 font-heading text-2xl font-extrabold text-[#16161a]">{value}</p>
        </div>
      ))}
    </div>
  );
}

export function statusBadge(status: CourseStatus) {
  if (status === "active") return <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">active</span>;
  if (status === "archived") return <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#16161a]">archived</span>;
  return <span className="rounded-full border border-black/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-black/60">draft</span>;
}
