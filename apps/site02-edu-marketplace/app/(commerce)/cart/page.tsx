import { RequireUser } from "@/features/auth/components/RequireUser";
import { CartView } from "@/features/cart/components/CartView";

export default function CartPage() {
  return (
    <RequireUser next="/cart">
      <CartView />
    </RequireUser>
  );
}
