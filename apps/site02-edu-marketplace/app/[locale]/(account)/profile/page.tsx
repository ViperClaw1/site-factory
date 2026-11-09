import { LearningProfile } from "@/features/profile/components/LearningProfile";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/profile");

export default function ProfilePage() {
  return <LearningProfile />;
}
