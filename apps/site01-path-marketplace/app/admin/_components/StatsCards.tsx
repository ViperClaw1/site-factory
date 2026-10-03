import { Badge, Card } from "@repo/ui";
import type { AdminStats } from "@/lib/admin/types";
import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";

export function StatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    ["Total", stats.total],
    ["Active", stats.byStatus.active],
    ["Draft", stats.byStatus.draft],
    ["Archived", stats.byStatus.archived],
    ...CATEGORIES.map((category) => [category.replace(/_/g, " "), stats.byCategory[category] ?? 0] as const),
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
      {cards.map(([label, value]) => (
        <Card key={label} className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
          <p className="mt-1 font-display text-2xl text-ink">{value}</p>
        </Card>
      ))}
    </div>
  );
}

export function statusBadge(status: string) {
  if (status === "active") return <Badge variant="limited">active</Badge>;
  if (status === "archived") return <Badge>archived</Badge>;
  return <Badge variant="default">draft</Badge>;
}
