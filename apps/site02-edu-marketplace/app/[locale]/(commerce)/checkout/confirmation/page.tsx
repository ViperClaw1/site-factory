import { ComingSoon } from "@/components/ComingSoon";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/checkout/confirmation");

export default function CheckoutConfirmationPage() {
  return (
    <ComingSoon title="Заказ принят" description="Подтверждение оплаты подключается вместе с PayMesh." />
  );
}
