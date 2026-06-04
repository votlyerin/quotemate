import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";

// Brevo template for courtesy trial expiration
const TEMPLATE_TRIAL_EXPIRED = 6;

// Max users to process per cron run (safety valve)
const BATCH_LIMIT = 200;

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel cron (or an authorised caller) may invoke this ──────
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const brevo = new BrevoClient({ apiKey: brevoApiKey });

  const results = { sent: 0, failed: 0, skipped: 0 };

  // ── Query: courtesy trial users whose trial has expired, not yet notified ──
  const { data: expiredUsers, error: queryErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, owner_name")
    .not("trial_ends_at", "is", null)
    .lt("trial_ends_at", new Date().toISOString())   // trial_ends_at in the past
    .is("stripe_customer_id", null)                  // never went through Stripe
    .is("trial_expired_email_sent_at", null)          // not yet notified
    .limit(BATCH_LIMIT);

  if (queryErr) {
    console.error("[cron/trial-expired] query error:", queryErr);
    return NextResponse.json({ error: queryErr.message }, { status: 500 });
  }

  for (const profile of expiredUsers ?? []) {
    // Resolve email: prefer profile contact email, fall back to auth email
    let toEmail = profile.email ?? null;
    if (!toEmail) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      toEmail = authUser?.user?.email ?? null;
    }

    if (!toEmail) {
      console.warn(`[cron/trial-expired] no email for profile ${profile.id} — skipping`);
      results.skipped++;
      continue;
    }

    // Extract first name from owner_name ("Sarah Johnson" → "Sarah")
    const firstName = (profile.owner_name || "").trim().split(/\s+/)[0] || "there";

    try {
      await brevo.transactionalEmails.sendTransacEmail({
        templateId: TEMPLATE_TRIAL_EXPIRED,
        to: [{ email: toEmail, name: profile.owner_name || undefined }],
        params: { FIRSTNAME: firstName },
      });

      // Mark expired + record send timestamp in one update
      await supabaseAdmin
        .from("profiles")
        .update({
          subscription_status: null,
          trial_expired_email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      results.sent++;
    } catch (err) {
      console.error(`[cron/trial-expired] failed for ${profile.id}:`, err);
      results.failed++;
    }
  }

  console.log("[cron/trial-expired] completed:", results);
  return NextResponse.json({ ok: true, results });
}
