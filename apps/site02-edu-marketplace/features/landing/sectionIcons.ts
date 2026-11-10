import type { SVGProps } from "react";
import {
  AccessibilityIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClipboardCheckIcon,
  FlaskIcon,
  GraduationCapIcon,
  ShapesIcon,
  SparklesIcon,
} from "@/components/icons";
import type { SectionId } from "./data";

// One icon per course section; kept apart from data.ts so server/admin imports stay icon-free.
export const SECTION_ICONS: Record<SectionId, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  preschool: ShapesIcon,
  school: BookOpenIcon,
  "exam-prep": ClipboardCheckIcon,
  "bachelor-master": GraduationCapIcon,
  phd: FlaskIcon,
  "mba-dba": BriefcaseIcon,
  "special-education": AccessibilityIcon,
  additional: SparklesIcon,
};
