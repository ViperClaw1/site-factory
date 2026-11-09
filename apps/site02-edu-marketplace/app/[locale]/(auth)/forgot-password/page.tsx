import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/forgot-password");

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
