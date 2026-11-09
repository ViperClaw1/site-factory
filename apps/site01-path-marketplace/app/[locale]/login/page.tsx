import { AuthForm } from "@/components/AuthForm";
import { Suspense } from "react";

// Suspense: AuthForm reads ?next via useSearchParams.
export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
