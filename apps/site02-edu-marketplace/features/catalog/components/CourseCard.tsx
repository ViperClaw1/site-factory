import Link from "next/link";
import type { Course } from "@repo/types";
import { formatPrice } from "@repo/lib";
import { Card } from "@repo/ui";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.slug}`} className="block h-full">
      <Card className="flex h-full flex-col border border-white/10 bg-white/5 p-6 transition hover:border-[var(--color-primary)]/40">
        <p className="text-xs uppercase tracking-widest text-[var(--color-primary)]">
          {course.level ?? course.category ?? "курс"}
        </p>
        <h3 className="mt-3 font-heading text-2xl italic">{course.title}</h3>
        {course.subtitle && <p className="mt-2 text-sm text-[var(--color-text)]/70">{course.subtitle}</p>}
        <p className="mt-auto pt-6 text-sm font-medium">
          {formatPrice(course.price, course.currency)}
          {course.duration_minutes != null ? ` · ${course.duration_minutes} мин` : null}
        </p>
      </Card>
    </Link>
  );
}
