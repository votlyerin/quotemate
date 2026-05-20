import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" | "recovery" | "magiclink" | etc.
  const next = searchParams.get("next") ?? "/onboarding";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  // ── Password reset — never touch the subscription, go straight to the form ──
  // Supabase sets type=recovery for all password-reset links. We must handle
  // this before any plan/Stripe logic so a Pro user clicking a reset link
  // doesn't get sent to Stripe checkout (and doesn't have their status clobbered).
  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  // ── Signup / email-confirmation — apply plan and route ───────────────────────
  const userId = data.session.user.id;
  const plan = data.session.user.user_metadata?.plan as "free" | "pro" | undefined;

  if (plan) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "subscription_status, stripe_customer_id, owner_name, business_name, has_used_trial"
      )
      .eq("id", userId)
      .single();

    const currentStatus = profile?.subscription_status;

    // "Stripe managed" = any non-free subscription state. These users must
    // never be sent to checkout again, regardless of their original signup plan.
    // Critically, trialing and trial_ending must be included — the old code only
    // checked active|past_due, which caused trialing users to be sent to Stripe
    // on every subsequent auth link (password reset, etc.).
    const isStripeManaged =
      currentStatus === "active" ||
      currentStatus === "trialing" ||
      currentStatus === "trial_ending" ||
      currentStatus === "past_due";

    if (isStripeManaged) {
      // Already subscribed — skip all plan logic and send to dashboard
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    if (plan === "pro") {
      // New Pro signup that hasn't completed checkout yet.
      // Set status to expired so quota limits apply until Stripe confirms payment.
      // The webhook upgrades this to "trialing" once checkout completes.
      await supabase
        .from("profiles")
        .update({ subscription_status: "expired", trial_ends_at: null })
        .eq("id", userId);

      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || origin.replace(/\/$/, "");

        // Reuse existing Stripe customer or create one
        let customerId = profile?.stripe_customer_id ?? undefined;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: data.session.user.email,
            name:
              profile?.business_name || profile?.owner_name || undefined,
            metadata: { supabase_user_id: userId },
          });
          customerId = customer.id;
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId);
        }

        const isFirstTrial = !profile?.has_used_trial;

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
          ...(isFirstTrial && {
            subscription_data: { trial_period_days: 14 },
          }),
          client_reference_id: userId,
          success_url: `${appUrl}/dashboard?checkout=success`,
          cancel_url: `${appUrl}/onboarding`,
          allow_promotion_codes: true,
        });

        if (session.url) {
          return NextResponse.redirect(session.url);
        }
      } catch (err) {
        console.error("Stripe checkout creation failed in auth/callback:", err);
        // Fall through to onboarding as a free account rather than blocking
      }

      return NextResponse.redirect(`${origin}/onboarding`);
    } else {
      // Free tier — mark as expired so quota limits apply immediately.
      // Clear trial_ends_at: the DB trigger may set it for all new users,
      // which would cause the trial banner to appear for free accounts.
      await supabase
        .from("profiles")
        .update({ subscription_status: "expired", trial_ends_at: null })
        .eq("id", userId);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
