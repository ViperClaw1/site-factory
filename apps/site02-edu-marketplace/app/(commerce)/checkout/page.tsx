import { RequireUser } from "@/features/auth/components/RequireUser";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <RequireUser next="/checkout">
      <CheckoutForm />
    </RequireUser>
  );
}