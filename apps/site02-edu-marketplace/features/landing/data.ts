import type { Dict } from "@/lib/i18n/dictionaries";

// Language-independent landing content; copy for each id lives in the i18n dictionaries.

export type CategoryId = Exclude<keyof Dict["courses"]["cats"], "all">;
export type CourseId = keyof Dict["courses"]["items"];
export type LevelId = keyof Dict["courses"]["levels"];
export type BadgeId = keyof Dict["courses"]["badges"];

export const unsplash = (id: string, width: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=70`;

export const CATEGORIES: CategoryId[] = ["programming", "data", "design", "devops", "mobile", "ai", "security"];

export const LEVELS: LevelId[] = ["beginner", "intermediate", "advanced"];

export const COURSES: {
  id: CourseId;
  category: CategoryId;
  level: LevelId;
  students: number;
  months: number;
  badge?: BadgeId;
  photo: string;
}[] = [
  { id: "python", category: "programming", level: "beginner", students: 48200, months: 9, badge: "bestseller", photo: "1517694712202-14dd9538aa97" },
  { id: "frontend", category: "programming", level: "intermediate", students: 31500, months: 10, badge: "popular", photo: "1633356122544-f134324a6cee" },
  { id: "analyst", category: "data", level: "beginner", students: 39800, months: 7, badge: "bestseller", photo: "1551288049-bebda4e38f71" },
  { id: "uxui", category: "design", level: "beginner", students: 22400, months: 8, photo: "1561070791-2526d30994b5" },
  { id: "devops", category: "devops", level: "advanced", students: 12900, months: 8, badge: "new", photo: "1558494949-ef010cbdcc31" },
  { id: "mobile", category: "mobile", level: "intermediate", students: 9700, months: 8, photo: "1512941937669-90a1b58e7e9c" },
  { id: "ml", category: "ai", level: "advanced", students: 17300, months: 12, badge: "new", photo: "1677442136019-21780ecad995" },
  { id: "security", category: "security", level: "intermediate", students: 8600, months: 10, badge: "popular", photo: "1550751827-4bd374c3f58b" },
];

export const STATS = [
  { value: 200, suffix: "K+" },
  { value: 180, suffix: "+" },
  { value: 120, suffix: "" },
  { value: 92, suffix: "%" },
];

export const INSTRUCTORS = [
  { name: "Alex Carter", company: "Google", students: 24000, photo: "1507003211169-0a1dd7228f2d" },
  { name: "Dmitry Sokolov", company: "Yandex", students: 31000, photo: "1500648767791-00dcc994a43e" },
  { name: "Priya Nair", company: "DeepMind", students: 15000, photo: "1438761681033-6461ffad8d80" },
  { name: "Lena Brandt", company: "Figma", students: 19000, photo: "1494790108377-be9c29b29330" },
];

export const TESTIMONIALS: { name: string; course: CourseId; photo: string }[] = [
  { name: "Maria K.", course: "analyst", photo: "1534528741775-53994a69daeb" },
  { name: "James O.", course: "frontend", photo: "1506794778202-cad84cf45f1d" },
  { name: "Yuki T.", course: "uxui", photo: "1544005313-94ddf0286df2" },
];

export const COMPANIES = [
  "Google", "Meta", "Spotify", "Stripe", "Yandex", "Amazon", "Microsoft", "Netflix",
  "Airbnb", "Uber", "Figma", "Notion", "Revolut", "Booking.com", "Shopify", "SAP",
];

export const SKILLS = [
  { name: "Python", color: "#3776AB" },
  { name: "React", color: "#61DAFB" },
  { name: "SQL", color: "#F29111" },
  { name: "Docker", color: "#2496ED" },
  { name: "TensorFlow", color: "#FF6F00" },
  { name: "Figma", color: "#F24E1E" },
];
