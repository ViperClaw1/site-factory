"use client";

import { AdminToolbar, type AdminFilters } from "@/app/admin/_components/AdminToolbar";
import { BulkUploadModal } from "@/app/admin/_components/BulkUploadModal";
import { DeleteProductDialog } from "@/app/admin/_components/DeleteProductDialog";
import { ProductFormModal } from "@/app/admin/_components/ProductFormModal";
import { ProductsTable } from "@/app/admin/_components/ProductsTable";
import { StatsCards } from "@/app/admin/_components/StatsCards";
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
      <StatsCards stats={stats} />
      <AdminToolbar filters={filters} onChange={(next) => push(next, 1)} onAdd={() => setAddOpen(true)} onBulk={() => setBulkOpen(true)} />
      <ProductsTable
        rows={rows}
        total={total}
        page={page}
        filteredEmpty={Boolean(filters.category || filters.status || filters.q)}
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
        onDeleted={(slug, warnings) => {
          const extra = warnings.length > 0 ? ` ${warnings.join(" ")}` : "";
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
