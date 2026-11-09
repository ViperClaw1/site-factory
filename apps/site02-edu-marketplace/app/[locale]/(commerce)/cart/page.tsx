import { RequireUser } from "@/features/auth/components/RequireUser";
import { CartView } from "@/features/cart/components/CartView";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/cart");

export default function CartPage() {
  return (
    <RequireUser next="/cart">
      <CartView />
    </RequireUser>
  );
}
