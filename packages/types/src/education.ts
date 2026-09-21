export type CourseStatus = "draft" | "active" | "archived";

export type LessonType = "video" | "audio" | "text";

export type EnrollmentStatus = "active" | "revoked";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseOrderStatus = "pending" | "paid" | "cancelled" | "refunded";

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  level: CourseLevel | null;
  language: string;
  category: string | null;
  tags: string[];
  cover_image: string | null;
  promo_video_url: string | null;
  price: number;
  currency: string;
  instructor_id: string | null;
  status: CourseStatus;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort: number;
  is_preview: boolean;
}

export interface Lesson {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  type: LessonType;
  duration_seconds: number | null;
  sort: number;
  is_preview: boolean;
  content_md: string | null;
  media_storage_path: string | null;
}

/** Public catalog shape — no lesson body or R2 path. */
export interface LessonOutline {
  id: string;
  module_id: string;
  slug: string;
  title: string;
  type: LessonType;
  duration_seconds: number | null;
  sort: number;
  is_preview: boolean;
}

export interface CourseModuleWithLessons extends CourseModule {
  lessons: LessonOutline[];
}

export interface CourseWithCurriculum extends Course {
  modules: CourseModuleWithLessons[];
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  order_id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  position_seconds: number;
  completed_at: string | null;
}

export interface CourseOrderItem {
  course_id: string;
  title: string;
  unit_price: number;
  quantity: 1;
}

export interface CourseOrder {
  id: string;
  user_id: string;
  status: CourseOrderStatus;
  payment_provider: string | null;
  payment_method: string | null;
  payment_id: string | null;
  items: CourseOrderItem[];
  subtotal: number;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
}
