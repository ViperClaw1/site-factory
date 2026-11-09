"use client";

import { AdminToolbar, type AdminFilters } from "@/app/admin/_components/AdminToolbar";
import { BulkUploadModal } from "@/app/admin/_components/BulkUploadModal";
import { DeleteProductDialog } from "@/app/admin/_components/DeleteProductDialog";
import { ProductFormModal } from "@/app/admin/_components/ProductFormModal";
import { ProductsTable } from "@/app/admin/_components/ProductsTable";
import { StatsCards } from "@/app/admin/_components/StatsCards";
import { downloadTextFile } from "@/lib/admin/catalog-json";
import type { AdminProductRow, AdminStats } from "@/lib/admin/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AdminDashboardProps {
  rows: AdminProductRow[];
  total: number;
  page: number;
  stats: AdminStats;
  filters: AdminFilters;
}

export function AdminDashboard({ rows, total, page, stats, filters }: AdminDashboardProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminProductRow | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [goneIds, setGoneIds] = useState<ReadonlySet<string>>(new Set());
  // Export selection survives paging, so products can be picked across pages.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [exporting, setExporting] = useState(false);
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

  function dropRow(id: string) {
    setGoneIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
    toggleSelected([id], false);
  }

  function toggleSelected(ids: string[], checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  // Download the export in the same JSON structure that bulk upload reads.
  async function exportCatalog(body: { ids: string[] } | AdminFilters) {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/products/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const count = (JSON.parse(text) as { products: unknown[] }).products.length;
      downloadTextFile(`catalog-export-${new Date().toISOString().slice(0, 10)}.json`, text);
      setNotice(`Exported ${count} product${count === 1 ? "" : "s"}.`);
    } catch {
      setNotice("Could not export products. Try again.");
    } finally {
      setExporting(false);
    }
  }

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
        <h1 className="font-display text-4xl text-ink">Catalog admin</h1>
      </header>
      <StatsCards stats={visibleStats} />
      <AdminToolbar
        filters={filters}
        onChange={(next) => {
          // A filter change hides rows, so keep no selection the admin can no longer see.
          setSelected(new Set());
          push(next, 1);
        }}
        onAdd={() => setAddOpen(true)}
        onBulk={() => setBulkOpen(true)}
        selectedCount={selected.size}
        exporting={exporting}
        onExportSelected={() => void exportCatalog({ ids: [...selected] })}
        onExportAll={() => void exportCatalog(filters)}
      />
      <ProductsTable
        rows={visibleRows}
        total={Math.max(0, total - removed.length)}
        page={page}
        filteredEmpty={Boolean(filters.category || filters.status || filters.q)}
        selected={selected}
        onSelect={toggleSelected}
        onPage={(nextPage) => push(filters, nextPage)}
        onAdd={() => setAddOpen(true)}
        onBulk={() => setBulkOpen(true)}
        onDelete={setPendingDelete}
      />
      <ProductFormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(slug, warnings) => {
          const extra = warnings.length > 0 ? ` Warnings: ${warnings.join(" ")}` : "";
          setNotice(`Created ${slug}.${extra}`);
          router.refresh();
        }}
      />
      <DeleteProductDialog
        product={pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        onDeleted={(id, slug, warnings) => {
          const extra = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";
          dropRow(id);
          setNotice(`Deleted ${slug}.${extra}`);
          setPendingDelete(null);
          router.refresh();
        }}
        onError={(message) => {
          setNotice(message);
          setPendingDelete(null);
          router.refresh();
        }}
      />
      <BulkUploadModal
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        onFinished={(created, failed) => {
          setNotice(`${created} created, ${failed} failed.`);
          router.refresh();
        }}
      />
      {notice && (
        <p role="status" className="fixed bottom-4 right-4 z-50 max-w-sm border border-black/10 bg-white px-4 py-3 text-sm shadow-lg">
          {notice}
        </p>
      )}
    </div>
  );
}
