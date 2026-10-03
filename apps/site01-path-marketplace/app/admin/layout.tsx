import { requireAdmin } from "@/lib/server/require-admin";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();
  if (!gate.ok) notFound();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8">
      <aside>
        <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Catalog</p>
        <Link href="/admin" className="mt-3 block text-sm font-semibold text-ink">
          Products
        </Link>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
