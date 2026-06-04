import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";

// Brevo template for onboarding reminder
const TEMPLATE_ONBOARDING_REMINDER = 7;

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

  const threeDaysAgo = new Date(
    Date.now() - 3 * 24 * 60 * 60 * 1000
  ).toISOString();

  // ── Query: signed up 3+ days ago, never completed onboarding, not yet notified
  const { data: users, error: queryErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, owner_name")
    .is("onboarded_at", null)
    .lt("created_at", threeDaysAgo)
    .is("onboarding_reminder_sent_at", null)
    .limit(BATCH_LIMIT);

  if (queryErr) {
    console.error("[cron/onboarding-reminder] query error:", queryErr);
    return NextResponse.json({ error: queryErr.message }, { status: 500 });
  }

  for (const profile of users ?? []) {
    // Resolve email: prefer profile contact email, fall back to auth email
    let toEmail = profile.email ?? null;
    if (!toEmail) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      toEmail = authUser?.user?.email ?? null;
    }

    if (!toEmail) {
      console.warn(`[cron/onboarding-reminder] no email for profile ${profile.id} — skipping`);
      results.skipped++;
      continue;
    }

    // Extract first name ("Sarah Johnson" → "Sarah", null → "there")
    const firstName = (profile.owner_name || "").trim().split(/\s+/)[0] || "there";

    try {
      await brevo.transactionalEmails.sendTransacEmail({
        templateId: TEMPLATE_ONBOARDING_REMINDER,
        to: [{ email: toEmail, name: profile.owner_name || undefined }],
        params: { FIRSTNAME: firstName },
      });

      await supabaseAdmin
        .from("profiles")
        .update({
          onboarding_reminder_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      results.sent++;
    } catch (err) {
      console.error(`[cron/onboarding-reminder] failed for ${profile.id}:`, err);
      results.failed++;
    }
  }

  console.log("[cron/onboarding-reminder] completed:", results);
  return NextResponse.json({ ok: true, results });
}
