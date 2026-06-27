import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { BrevoClient } from "@getbrevo/brevo";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup" | "recovery" | "magiclink" | etc.
  const next = searchParams.get("next") ?? "/onboarding";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin.replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=auth`);
  }

  // Track every cookie Supabase wants to set so we can stamp them explicitly
  // onto whichever NextResponse.redirect() we return.
  //
  // Why: NextResponse.redirect() creates a fresh Response object. Cookies
  // queued via cookies() from next/headers (the setAll path below) are NOT
  // guaranteed to appear on a redirect response in all Next.js versions.
  // By capturing them here and calling res.cookies.set() manually we ensure
  // the session is written to the browser on every possible exit path —
  // including the redirect to Stripe checkout.
  const cookieStore = await cookies();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionCookies: Array<{ name: string; value: string; options: any }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Capture for the redirect response…
          cookiesToSet.forEach((c) => sessionCookies.push(c));
          // …and also persist via next/headers so any subsequent
          // supabase calls in this same handler see the session.
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Silently ignore — can throw in Server Component context
            }
          });
        },
      },
    }
  );

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  /** Redirect and stamp all session cookies onto the response. */
  function authRedirect(url: string) {
    const res = NextResponse.redirect(url);
    sessionCookies.forEach(({ name, value, options }) =>
      res.cookies.set(name, value, options)
    );
    return res;
  }

  if (error || !data.session) {
    return NextResponse.redirect(`${appUrl}/login?error=auth`);
  }

  // ── Password reset — never run plan/Stripe logic ─────────────────────────
  // Supabase sets type=recovery for all password-reset links.
  if (type === "recovery") {
    return authRedirect(`${appUrl}/reset-password`);
  }

  // ── Signup / email confirmation — apply plan and route ───────────────────
  const userId = data.session.user.id;
  const plan = data.session.user.user_metadata?.plan as "free" | "pro" | undefined;
  const termsAgreedAt = data.session.user.user_metadata?.terms_agreed_at as string | undefined;
  const marketingOptedIn = !!data.session.user.user_metadata?.marketing_opted_in;
  const marketingOptedInAt = marketingOptedIn ? new Date().toISOString() : null;

  if (plan) {
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "subscription_status, stripe_customer_id, owner_name, business_name, has_used_trial"
      )
      .eq("id", userId)
      .single();

    const currentStatus = profile?.subscription_status;

    // Already has an active subscription — skip all plan logic.
    // Includes trialing so a user in their 14-day trial can never be
    // redirected to checkout again by a stray auth link.
    const isStripeManaged =
      currentStatus === "active" ||
      currentStatus === "trialing" ||
      currentStatus === "trial_ending" ||
      currentStatus === "past_due";

    if (isStripeManaged) {
      return authRedirect(`${appUrl}/dashboard`);
    }

    if (plan === "pro") {
      // New Pro signup — require a card via Stripe checkout.
      // Status stays expired until the Stripe webhook confirms payment.
      await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          trial_ends_at: null,
          ...(termsAgreedAt ? { terms_agreed_at: termsAgreedAt } : {}),
          ...(marketingOptedInAt ? { marketing_opted_in_at: marketingOptedInAt } : {}),
        })
        .eq("id", userId);
      void syncBrevoContact(data.session.user.email, marketingOptedIn);

      try {
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
          // authRedirect stamps the session cookies so the user is still
          // authenticated when Stripe sends them back to /dashboard.
          return authRedirect(session.url);
        }
      } catch (err) {
        console.error("Stripe checkout creation failed in auth/callback:", err);
      }

      // Stripe session creation failed — land on onboarding as free
      return authRedirect(`${appUrl}/onboarding`);
    } else {
      // Free tier — mark expired so quota limits apply immediately
      await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          trial_ends_at: null,
          ...(termsAgreedAt ? { terms_agreed_at: termsAgreedAt } : {}),
          ...(marketingOptedInAt ? { marketing_opted_in_at: marketingOptedInAt } : {}),
        })
        .eq("id", userId);
      void syncBrevoContact(data.session.user.email, marketingOptedIn);
    }
  }

  return authRedirect(`${appUrl}${next}`);
}

// Fire-and-forget — syncs the user's marketing opt-in preference to Brevo.
// NOTE: MARKETING_OPT_IN must exist as a boolean contact attribute in Brevo
// (Contacts → Contact Attributes → Add new attribute) before values will save.
async function syncBrevoContact(email: string | undefined, marketingOptIn: boolean) {
  if (!email || !process.env.BREVO_API_KEY) return;
  try {
    const brevo = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
    await brevo.contacts.createContact({
      email,
      attributes: { MARKETING_OPT_IN: marketingOptIn },
      updateEnabled: true,
    });
  } catch (err) {
    console.error("[auth/callback] Brevo contact sync failed:", err);
  }
}
