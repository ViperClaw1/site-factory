import { AuthForm } from "@/features/auth/components/AuthForm";
import { Suspense } from "react";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/signup");

// Suspense: AuthForm reads ?next via useSearchParams.
export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
