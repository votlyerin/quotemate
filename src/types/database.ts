export interface TruckloadPricing {
  min: number;
  eight: number;
  qtr: number;
  half: number;
  three: number;
  full: number;
  multiple?: number;
}

export interface Profile {
  id: string;
  business_name: string | null;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  service_area: string | null;
  min_price: number;
  target_margin: number;
  labor_rate: number;
  default_crew_size: number;
  default_travel_fee: number;
  quote_expiry_days: number;
  truckload_pricing: TruckloadPricing;
  dump_fee_per_ton: number | null;
  dump_fee_mode: "per_ton" | "flat_rate" | null;
  flat_dump_fees: Record<string, number> | null;
  item_surcharges: Record<string, number>;
  complexity_fees: Record<string, number>;
  // Onboarding
  onboarding_step: number | null;
  onboarded_at: string | null;
  // Subscription
  has_used_trial: boolean;
  stripe_customer_id: string | null;
  subscription_status: "trialing" | "active" | "past_due" | "canceled" | "expired" | null;
  subscription_id: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  trial_expired_email_sent_at: string | null;
  onboarding_reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  quote_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_address: string | null;
  source: string | null;
  load_size: string | null;
  job_type: string | null;
  complexity_factors: string[];
  labor_hours: number | null;
  crew_size: number | null;
  dump_fee: number;
  travel_fee: number;
  addons: number;
  discount: number;
  notes: string | null;
  photos_reviewed: boolean;
  recommended_price: number | null;
  final_price: number | null;
  total_cost: number | null;
  profit: number | null;
  margin_pct: number | null;
  margin_status: "excellent" | "good" | "risky" | "underpriced" | null;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  override_reason: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export type MarginStatus = "excellent" | "good" | "risky" | "underpriced";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
