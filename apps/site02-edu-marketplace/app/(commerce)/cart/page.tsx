"use client";

import { ComingSoon } from "@/components/ComingSoon";
import { useI18n } from "@/lib/i18n/LanguageProvider";

// Placeholder until the E3 cart (specs/site02-E3-payment-flow-plan.md).
export default function CartPage() {
  const { t } = useI18n();
  return <ComingSoon eyebrow={t.catalog.soon} title={t.catalog.cartTitle} description={t.catalog.cartText} />;
}
