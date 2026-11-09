import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/login");

// Suspense: AuthForm reads ?next via useSearchParams.
export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
