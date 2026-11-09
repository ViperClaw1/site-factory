import { ComingSoon } from "@/components/ComingSoon";
import { localeMetadata } from "@repo/i18n";

export const generateMetadata = localeMetadata("/account/orders");

export default function AccountOrdersPage() {
  return (
    <ComingSoon title="Заказы" description="История заказов подключается в фазе E3." />
  );
}
