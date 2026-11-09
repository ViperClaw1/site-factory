import { RequireUser } from "@/features/auth/components/RequireUser";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/checkout");

export default function CheckoutPage() {
  return (
    <RequireUser next="/checkout">
      <CheckoutForm />
    </RequireUser>
  );
}