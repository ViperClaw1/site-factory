import { ComingSoon } from "@/components/ComingSoon";
import { alternates, type Lang } from "@repo/i18n";

export function generateMetadata({ params }: { params: { locale: Lang; id: string } }) {
  return { alternates: alternates(`/account/orders/${params.id}`, params.locale) };
}

export default function AccountOrderPage() {
  return (
    <ComingSoon title="Заказ" description="Детали заказа появятся вместе с оплатой." />
  );
}
