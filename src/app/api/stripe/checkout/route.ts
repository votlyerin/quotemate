import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { BETA_MODE } from "@/lib/beta";

export async function POST(request: Request) {
  // BETA_MODE — remove bypass when beta ends
  if (BETA_MODE) {
    return NextResponse.json(
      { error: "Checkout is not available during the beta period" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan"); // "pro_upgrade" → no trial, uses STRIPE_PRO_UPGRADE_PRICE_ID

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile to check for existing Stripe customer and trial eligibility
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, owner_name, business_name, has_used_trial")
      .eq("id", user.id)
      .single();

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Reuse existing Stripe customer or create one
    let customerId = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.business_name || profile?.owner_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Persist the new customer ID immediately
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // pro_upgrade: existing free-tier user upgrading — no trial, dedicated price ID
    if (plan === "pro_upgrade") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price: process.env.STRIPE_PRO_UPGRADE_PRICE_ID!,
            quantity: 1,
          },
        ],
        client_reference_id: user.id,
        success_url: `${appUrl}/dashboard?checkout=success`,
        cancel_url: `${appUrl}/settings`,
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    // Default: new subscriber — offer 14-day trial to first-timers only.
    // has_used_trial is set to true by the webhook the moment any trial checkout
    // completes — it never resets, so returning users pay immediately.
    const isFirstTrial = !profile?.has_used_trial;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      ...(isFirstTrial && {
        subscription_data: {
          trial_period_days: 14,
        },
      }),
      client_reference_id: user.id,
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/settings`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
