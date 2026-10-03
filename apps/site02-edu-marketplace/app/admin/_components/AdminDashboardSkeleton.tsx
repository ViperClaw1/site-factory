import { CATEGORIES } from "@/lib/admin/catalog";

const STAT_LABELS = ["Total", "Active", "Draft", "Archived", ...CATEGORIES];

function Shimmer({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`admin-shimmer relative block ${className}`} />;
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#16161a]">Course admin</h1>
      <p className="sr-only">Loading courses</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {STAT_LABELS.map((label) => (
          <div key={label} className="rounded-2xl border border-black/10 bg-white p-4">
            <div className="relative">
              <p className="invisible text-xs font-semibold uppercase tracking-wide">{label}</p>
              <Shimmer className="absolute inset-0 rounded" />
            </div>
            <div className="relative mt-1">
              <p className="invisible font-heading text-2xl font-extrabold">00</p>
              <Shimmer className="absolute inset-y-0 left-0 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="pointer-events-none flex flex-wrap items-end gap-3" aria-hidden>
        {["Category", "Status", "Search"].map((label) => (
          <label key={label} className="text-xs font-semibold uppercase tracking-wide text-black/45">
            {label}
            <Shimmer className="mt-1 h-10 w-36 rounded-xl" />
          </label>
        ))}
        <div className="ml-auto">
          <Shimmer className="h-12 w-32 rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Shimmer key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
