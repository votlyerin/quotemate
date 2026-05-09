import Stripe from "stripe";

// Re-export pure helpers (no Stripe SDK) so server code can use one import
export { getEffectiveSubStatus, trialDaysLeft } from "./subscription";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiVersion: "2026-04-22.dahlia" as any,
});

/** Supabase admin client for webhook handlers (bypasses RLS). */
export function getSupabaseAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
