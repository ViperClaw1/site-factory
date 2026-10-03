import { COURSES, unsplash } from "@/features/landing/data";

export type StaticCourse = {
  id: string;
  numericId: string;
  title: string;
  category: string;
  level: string;
  months: number;
  learners: number;
  price: number;
  photo: string;
  summary: string;
};

const PRICES: Record<string, number> = {
  python: 599,
  frontend: 649,
  analyst: 549,
  uxui: 499,
  devops: 699,
  mobile: 629,
  ml: 749,
  security: 679,
};

const SUMMARIES: Record<string, string> = {
  python: "From syntax to production-ready backend services.",
  frontend: "Build fast interfaces with React, TypeScript and Next.js.",
  analyst: "SQL, Python and dashboards that drive decisions.",
  uxui: "Research, prototype and ship interfaces in Figma.",
  devops: "Docker, Kubernetes, CI/CD and cloud infrastructure.",
  mobile: "One codebase for iOS and Android apps.",
  ml: "Train, evaluate and deploy models with TensorFlow.",
  security: "Pentesting, defense and incident response.",
};

const TITLES: Record<string, string> = {
  python: "Python Developer",
  frontend: "Frontend Developer: React",
  analyst: "Data Analyst",
  uxui: "UX/UI Designer",
  devops: "DevOps Engineer",
  mobile: "Mobile Developer: Flutter",
  ml: "Machine Learning Engineer",
  security: "Cybersecurity Specialist",
};

export const STATIC_COURSES: StaticCourse[] = COURSES.map((course, index) => ({
  id: course.id,
  numericId: String(index + 1),
  title: TITLES[course.id] ?? course.id,
  category: course.category,
  level: course.level,
  months: course.months,
  learners: course.students,
  price: PRICES[course.id] ?? 599,
  photo: unsplash(course.photo, 1400),
  summary: SUMMARIES[course.id] ?? "",
}));

export function findStaticCourse(id: string) {
  return STATIC_COURSES.find((course) => course.id === id || course.numericId === id);
}

export const LEARNING_OUTCOMES = [
  "Build maintainable applications from scratch",
  "Work confidently with professional tools",
  "Review, test, and ship production code",
  "Present a polished portfolio to employers",
];

export const INCLUDED = [
  "Weekly mentor sessions",
  "Professional certificate",
  "Lifetime access to materials",
];

export const PROGRAM = [
  { title: "Core foundations", lessons: ["Environment and tooling", "Language essentials", "First graded project"] },
  { title: "Applied practice", lessons: ["APIs and data", "Testing habits", "Code review with a mentor"] },
  { title: "Portfolio project", lessons: ["Brief and scope", "Build in public", "Demo and write-up"] },
  { title: "Career launch", lessons: ["Resume and GitHub", "Mock interviews", "Offer checklist"] },
];
