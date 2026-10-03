import { AdminDashboard } from "@/app/admin/_components/AdminDashboard";
import { listCourses } from "@/lib/server/admin-courses";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; q?: string; page?: string };
}) {
  const data = await listCourses({
    category: searchParams.category,
    status: searchParams.status,
    q: searchParams.q,
    page: Number(searchParams.page ?? "1"),
  });

  return (
    <AdminDashboard
      rows={data.items}
      total={data.total}
      page={data.page}
      stats={data.stats}
      filters={{
        category: searchParams.category ?? "",
        status: searchParams.status ?? "",
        q: searchParams.q ?? "",
      }}
    />
  );
}
