import { DEFAULT_LANG } from "@repo/i18n";
import { RootDocument, baseMetadata } from "@/components/RootDocument";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = baseMetadata;

// A root layout of its own: the admin has no language prefix. Moving between it
// and the storefront is a full page load.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument lang={DEFAULT_LANG}>
      <div className="min-h-[calc(100vh-72px)] bg-[#f4f4f6] text-[#16161a] [color-scheme:light]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8">
        <aside>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Catalog</p>
          <Link href="/admin" className="mt-3 block text-sm font-semibold text-[#16161a]">
            Courses
          </Link>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
      </div>
    </RootDocument>
  );
}
