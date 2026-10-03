import type { CourseStatus } from "@repo/types";

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  status: CourseStatus;
  language: string;
  coverUrl: string | null;
  updatedAt: string;
}

export interface AdminStats {
  total: number;
  byStatus: Record<CourseStatus, number>;
  byCategory: Record<string, number>;
}

export const ADMIN_PAGE_SIZE = 50;

export interface LocaleCopy {
  title: string;
  subtitle: string;
  description: string;
}
