export interface SubscriptionPlan {
  id: string;
  slug: string;
  name: string;
  type: string;
  price_monthly: number | null;
  price_yearly: number | null;
  currency: string;
  features: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";

export type BillingCycle = "monthly" | "yearly";

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  payment_provider: string | null;
  provider_sub_id: string | null;
  billing_cycle: BillingCycle | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}
