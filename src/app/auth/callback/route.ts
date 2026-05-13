import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Apply the plan to the profile for NEW accounts only.
      // We detect "new" by checking whether subscription_status is still null —
      // existing users (password reset, magic link re-login) already have a status.
      const userId = data.session.user.id;
      const plan = data.session.user.user_metadata?.plan as
        | "free"
        | "pro"
        | undefined;

      if (plan) {
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "subscription_status, stripe_customer_id, owner_name, business_name, has_used_trial"
          )
          .eq("id", userId)
          .single();

        // Only apply signup plan if the account isn't already managed by Stripe
        // (active paid subscription or past_due). This protects existing subscribers
        // who do a password reset — their plan from original signup metadata won't
        // overwrite their live subscription status.
        const currentStatus = profile?.subscription_status;
        const isStripeManaged =
          currentStatus === "active" || currentStatus === "past_due";

        if (!isStripeManaged) {
          if (plan === "pro") {
            // For Pro signups we require a credit card via Stripe checkout.
            // Set status to expired (free default) — the Stripe webhook will
            // upgrade to "trialing" + set has_used_trial once checkout completes.
            // This prevents a free trial from being gifted without payment info.
            await supabase
              .from("profiles")
              .update({ subscription_status: "expired", trial_ends_at: null })
              .eq("id", userId);

            // Create a Stripe checkout session and redirect the user to it.
            try {
              const appUrl =
                process.env.NEXT_PUBLIC_APP_URL ||
                origin.replace(/\/$/, "");

              // Reuse existing Stripe customer or create one
              let customerId = profile?.stripe_customer_id ?? undefined;
              if (!customerId) {
                const customer = await stripe.customers.create({
                  email: data.session.user.email,
                  name:
                    profile?.business_name ||
                    profile?.owner_name ||
                    undefined,
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
                line_items: [
                  { price: process.env.STRIPE_PRICE_ID!, quantity: 1 },
                ],
                ...(isFirstTrial && {
                  subscription_data: { trial_period_days: 14 },
                }),
                client_reference_id: userId,
                success_url: `${appUrl}/dashboard?checkout=success`,
                // If the user cancels, send them to onboarding as a free account
                cancel_url: `${appUrl}/onboarding`,
                allow_promotion_codes: true,
              });

              if (session.url) {
                return NextResponse.redirect(session.url);
              }
            } catch (err) {
              console.error(
                "Stripe checkout creation failed in auth/callback:",
                err
              );
              // Fall through to the generic onboarding redirect below
            }

            // Fallback: if Stripe session creation fails, send to onboarding
            // as a free account rather than blocking the user entirely.
            return NextResponse.redirect(`${origin}/onboarding`);
          } else {
            // Free tier — mark as expired so quota limits apply immediately.
            // Also clear trial_ends_at: the DB trigger may set it for all new
            // users, which would cause the trial banner to appear for free accounts.
            await supabase
              .from("profiles")
              .update({ subscription_status: "expired", trial_ends_at: null })
              .eq("id", userId);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
