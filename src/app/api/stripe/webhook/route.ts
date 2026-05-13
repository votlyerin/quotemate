import { stripe, getSupabaseAdmin } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

// Tell Next.js not to parse the body — we need raw bytes for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) break;

        // Fetch the subscription to determine whether it started in trial.
        // We need the actual status rather than assuming "active" — Stripe creates
        // trial subscriptions with status "trialing", not "active".
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const isTrialing = subscription.status === "trialing";

        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_id: subscriptionId,
            subscription_status: isTrialing ? "trialing" : "active",
            // Persist trial end date so the in-app countdown banner works correctly
            ...(isTrialing && subscription.trial_end && {
              trial_ends_at: new Date(
                subscription.trial_end * 1000
              ).toISOString(),
            }),
            // Mark trial as used the moment checkout completes — never resets,
            // even if the user later cancels or churns.
            has_used_trial: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      // ── Subscription updated (status changes) ─────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const stripeStatus = sub.status;
        // Map all Stripe statuses to our internal values.
        // "trialing" must be handled here — Stripe fires subscription.updated
        // with status "trialing" shortly after a trial checkout completes, and
        // again whenever trial metadata changes. Falling through to "expired"
        // would immediately revoke Pro access for users in an active trial.
        const dbStatus =
          stripeStatus === "active"
            ? "active"
            : stripeStatus === "trialing"
              ? "trialing"
              : stripeStatus === "past_due"
                ? "past_due"
                : stripeStatus === "canceled"
                  ? "canceled"
                  : "expired";

        await supabase
          .from("profiles")
          .update({
            subscription_status: dbStatus,
            subscription_id: sub.id,
            // Keep trial_ends_at in sync with Stripe so the countdown banner
            // displays accurate days-remaining throughout the trial period.
            ...(stripeStatus === "trialing" && sub.trial_end && {
              trial_ends_at: new Date(sub.trial_end * 1000).toISOString(),
            }),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ── Subscription deleted / canceled ───────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
            subscription_ends_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
        break;
      }

      // ── Payment succeeded (recover from past_due) ─────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Only update if currently past_due
        await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId)
          .eq("subscription_status", "past_due");
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
