import { CATEGORIES } from "@/lib/catalog-taxonomy.mjs";
import { Button, Card } from "@repo/ui";
import type { ReactNode } from "react";

const STAT_LABELS = ["Total", "Active", "Draft", "Archived", ...CATEGORIES.map((category) => category.replace(/_/g, " "))];
const ROW_COUNT = 8;

function Shimmer({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`shimmer relative block ${className}`} />;
}

function StatCardSkeleton({ label }: { label: string }) {
  return (
    <Card className="p-4">
      <div className="relative">
        <p className="invisible text-xs font-semibold uppercase tracking-wide">{label}</p>
        <Shimmer className="absolute inset-0" />
      </div>
      <div className="relative mt-1">
        <p className="invisible font-display text-2xl">00</p>
        <Shimmer className="absolute inset-y-0 left-0 w-10" />
      </div>
    </Card>
  );
}

function ControlSkeleton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs font-semibold uppercase tracking-wide text-black/45">
      {label}
      <span className="relative mt-1 block">{children}</span>
    </label>
  );
}

const CONTROL_CLASS = "invisible block border-2 border-transparent px-3 py-2 text-sm font-normal normal-case tracking-normal";

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <h1 className="font-display text-4xl text-ink">Catalog admin</h1>
      <p className="sr-only">Loading products</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
        {STAT_LABELS.map((label) => (
          <StatCardSkeleton key={label} label={label} />
        ))}
      </div>
      <div className="pointer-events-none flex flex-wrap items-end gap-3" aria-hidden>
        <ControlSkeleton label="Category">
          <select className={CONTROL_CLASS} defaultValue="" tabIndex={-1}>
            <option value="">All</option>
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <Shimmer className="absolute inset-0" />
        </ControlSkeleton>
        <ControlSkeleton label="Status">
          <select className={CONTROL_CLASS} defaultValue="" tabIndex={-1}>
            <option value="">All</option>
            <option value="active">active</option>
            <option value="draft">draft</option>
            <option value="archived">archived</option>
          </select>
          <Shimmer className="absolute inset-0" />
        </ControlSkeleton>
        <div className="flex items-end gap-2">
          <ControlSkeleton label="Search">
            <input className={CONTROL_CLASS} defaultValue="" placeholder="Title or slug" tabIndex={-1} readOnly />
            <Shimmer className="absolute inset-0" />
          </ControlSkeleton>
          <span className="relative">
            <Button type="button" variant="secondary" tabIndex={-1} className="invisible">
              Search
            </Button>
            <Shimmer className="absolute inset-0 rounded-full" />
          </span>
        </div>
        <div className="ml-auto flex gap-2">
          <span className="relative">
            <Button type="button" variant="secondary" tabIndex={-1} className="invisible">
              Bulk upload
            </Button>
            <Shimmer className="absolute inset-0 rounded-full" />
          </span>
          <span className="relative">
            <Button type="button" tabIndex={-1} className="invisible">
              Add product
            </Button>
            <Shimmer className="absolute inset-0 rounded-full" />
          </span>
        </div>
      </div>
      <div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-black/40">
                <th className="p-2"> </th>
                <th className="p-2">Title</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Category</th>
                <th className="p-2">Price</th>
                <th className="p-2">Status</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Media</th>
                <th className="p-2">Updated</th>
                <th className="p-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROW_COUNT }, (_, index) => (
                <tr key={index} className="border-t border-black/10">
                  <td className="p-2">
                    <Shimmer className="h-10 w-10" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-36" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-44" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-28" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-14" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-6 w-[4.5rem] rounded-full" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-6" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-4" />
                  </td>
                  <td className="p-2">
                    <Shimmer className="h-5 w-40" />
                  </td>
                  <td className="p-2 text-right">
                    <Shimmer className="ml-auto h-9 w-9" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Shimmer className="h-5 w-24" />
          <div className="flex gap-2" aria-hidden>
            <span className="relative">
              <Button type="button" variant="ghost" tabIndex={-1} className="invisible">
                Previous
              </Button>
              <Shimmer className="absolute inset-0 rounded-full" />
            </span>
            <span className="relative">
              <Button type="button" variant="ghost" tabIndex={-1} className="invisible">
                Next
              </Button>
              <Shimmer className="absolute inset-0 rounded-full" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
