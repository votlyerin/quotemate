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

        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_id: subscriptionId,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      // ── Subscription updated (status changes) ─────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const stripeStatus = sub.status; // active | past_due | canceled | unpaid | ...
        // NOTE: "trialing" is intentionally not mapped here — checkout.session.completed
        // sets the initial status. Add `stripeStatus === "trialing" ? "trialing" :` here
        // if Stripe sends subscription.updated events during an active trial period.
        const dbStatus =
          stripeStatus === "active"
            ? "active"
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
