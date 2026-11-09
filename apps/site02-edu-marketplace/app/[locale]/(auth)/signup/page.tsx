import { AuthForm } from "@/features/auth/components/AuthForm";
import { Suspense } from "react";

// Suspense: AuthForm reads ?next via useSearchParams.
export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
