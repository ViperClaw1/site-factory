"use client";

import { AdminToolbar, type AdminFilters } from "@/app/admin/_components/AdminToolbar";
import { CourseFormModal } from "@/app/admin/_components/CourseFormModal";
import { CoursesTable } from "@/app/admin/_components/CoursesTable";
import { DeleteCourseDialog } from "@/app/admin/_components/DeleteCourseDialog";
import { StatsCards } from "@/app/admin/_components/StatsCards";
import type { AdminCourseRow, AdminStats } from "@/lib/admin/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminDashboardProps {
  rows: AdminCourseRow[];
  total: number;
  page: number;
  stats: AdminStats;
  filters: AdminFilters;
}

export function AdminDashboard({ rows, total, page, stats, filters }: AdminDashboardProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminCourseRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [goneIds, setGoneIds] = useState<ReadonlySet<string>>(new Set());
  const removed = rows.filter((row) => goneIds.has(row.id));
  const visibleRows = rows.filter((row) => !goneIds.has(row.id));
  const visibleStats: AdminStats = {
    total: Math.max(0, stats.total - removed.length),
    byStatus: {
      active: Math.max(0, stats.byStatus.active - removed.filter((row) => row.status === "active").length),
      draft: Math.max(0, stats.byStatus.draft - removed.filter((row) => row.status === "draft").length),
      archived: Math.max(0, stats.byStatus.archived - removed.filter((row) => row.status === "archived").length),
    },
    byCategory: Object.fromEntries(
      Object.entries(stats.byCategory).map(([category, count]) => [
        category,
        Math.max(0, count - removed.filter((row) => row.category === category).length),
      ]),
    ),
  };

  function push(next: AdminFilters, nextPage = 1) {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    router.push(query ? `/admin?${query}` : "/admin");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#16161a]">Course admin</h1>
      </header>
      <StatsCards stats={visibleStats} />
      <AdminToolbar filters={filters} onChange={(next) => push(next, 1)} onAdd={() => setAddOpen(true)} />
      <CoursesTable
        rows={visibleRows}
        total={Math.max(0, total - removed.length)}
        page={page}
        filteredEmpty={Boolean(filters.category || filters.status || filters.q)}
        onPage={(nextPage) => push(filters, nextPage)}
        onAdd={() => setAddOpen(true)}
        onDelete={setPendingDelete}
      />
      <CourseFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(slug) => {
          setNotice(`Created ${slug}.`);
          router.refresh();
        }}
      />
      <DeleteCourseDialog
        course={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onDeleted={(id, slug) => {
          setGoneIds((current) => new Set(current).add(id));
          setNotice(`Deleted ${slug}.`);
          setPendingDelete(null);
          router.refresh();
        }}
        onError={(message) => {
          setNotice(message);
          setPendingDelete(null);
        }}
      />
      {notice && (
        <p role="status" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#16161a] shadow-lg">
          {notice}
        </p>
      )}
    </div>
  );
}
