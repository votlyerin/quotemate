import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";

// Template IDs configured in Brevo
const TEMPLATE_FREE_WELCOME = 1;
const TEMPLATE_PRO_WELCOME  = 3;

export async function POST(_req: NextRequest) {
  try {
    // ── Auth check ─────────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Fetch profile via service role ─────────────────────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("business_name, owner_name, email, subscription_status, sent_welcome_email")
      .eq("id", user.id)
      .single();

    // Already sent — idempotent, return success
    if (profile?.sent_welcome_email) {
      return NextResponse.json({ skipped: true, reason: "already_sent" });
    }

    // Determine which template to use based on subscription status
    const status = profile?.subscription_status ?? "free";
    const isTrialing = status === "trialing";
    const isFree = !isTrialing; // send free welcome for any non-trialing status

    const templateId = isTrialing ? TEMPLATE_PRO_WELCOME : TEMPLATE_FREE_WELCOME;

    // Use auth email as the delivery address (always correct); profile.email
    // may be a separate business contact address set by the owner.
    const recipientEmail = user.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "No recipient email" }, { status: 400 });
    }

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
    }

    // ── Send via Brevo template ────────────────────────────────────────────────
    const brevo = new BrevoClient({ apiKey: brevoApiKey });

    await brevo.transactionalEmails.sendTransacEmail({
      templateId,
      to: [
        {
          email: recipientEmail,
          name: profile?.owner_name || profile?.business_name || undefined,
        },
      ],
      params: {
        FIRSTNAME:     profile?.owner_name    || "there",
        BUSINESS_NAME: profile?.business_name || "your business",
      },
    });

    // ── Mark as sent ───────────────────────────────────────────────────────────
    await supabaseAdmin
      .from("profiles")
      .update({ sent_welcome_email: true, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    console.log(
      `[welcome-email] Sent template ${templateId} (${isTrialing ? "pro" : "free"}) to ${recipientEmail}`
    );

    return NextResponse.json({ success: true, templateId });
  } catch (err: unknown) {
    console.error("[welcome-email]", err);
    const msg = err instanceof Error ? err.message : "Failed to send welcome email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
