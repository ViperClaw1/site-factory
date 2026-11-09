import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/reset-password");

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
