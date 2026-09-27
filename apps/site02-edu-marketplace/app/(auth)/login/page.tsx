import { AuthForm } from "@/features/auth/components/AuthForm";
import { Suspense } from "react";

// Suspense: AuthForm reads ?next / ?error via useSearchParams.
export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
