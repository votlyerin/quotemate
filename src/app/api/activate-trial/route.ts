import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/activate-trial
 *
 * Starts a 14-day Pro trial for the authenticated user without requiring
 * Stripe. Only runs when the account is NOT already Stripe-managed
 * (active or past_due). Safe to call multiple times — idempotent for
 * already-trialing accounts.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const currentStatus = profile?.subscription_status;

  // Never overwrite a live Stripe subscription
  if (currentStatus === "active" || currentStatus === "past_due") {
    return NextResponse.json(
      { error: "Account already has an active subscription." },
      { status: 400 }
    );
  }

  const trialEnd = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await supabase
    .from("profiles")
    .update({ subscription_status: "trialing", trial_ends_at: trialEnd })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
