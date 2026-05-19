import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";

// Template IDs configured in Brevo
const TEMPLATE_FREE_DAY3 = 2;
const TEMPLATE_PRO_DAY5  = 4;

// Max users to process per cron run (safety valve)
const BATCH_LIMIT = 200;

export async function GET(req: NextRequest) {
  // ── Auth: only Vercel cron (or an authorised caller) may invoke this ─────────
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
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const brevo = new BrevoClient({ apiKey: brevoApiKey });

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo  = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  const results = {
    day3: { sent: 0, failed: 0, skipped: 0 },
    day5: { sent: 0, failed: 0, skipped: 0 },
  };

  // ── Day-3 free users ─────────────────────────────────────────────────────────
  const { data: day3Users, error: day3Err } = await supabaseAdmin
    .from("profiles")
    .select("id, email, owner_name, business_name")
    .eq("subscription_status", "free")
    .eq("sent_day3_email", false)
    .not("onboarded_at", "is", null)
    .lte("onboarded_at", threeDaysAgo)
    .limit(BATCH_LIMIT);

  if (day3Err) {
    console.error("[cron/emails] day3 query error:", day3Err);
  }

  for (const profile of day3Users ?? []) {
    if (!profile.email) {
      results.day3.skipped++;
      continue;
    }
    try {
      await brevo.transactionalEmails.sendTransacEmail({
        templateId: TEMPLATE_FREE_DAY3,
        to: [
          {
            email: profile.email,
            name: profile.owner_name || profile.business_name || undefined,
          },
        ],
        params: {
          FIRSTNAME:     profile.owner_name    || "there",
          BUSINESS_NAME: profile.business_name || "your business",
        },
      });

      await supabaseAdmin
        .from("profiles")
        .update({ sent_day3_email: true, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      results.day3.sent++;
    } catch (err) {
      console.error(`[cron/emails] day3 send failed for ${profile.id}:`, err);
      results.day3.failed++;
    }
  }

  // ── Day-5 trialing (Pro) users ───────────────────────────────────────────────
  const { data: day5Users, error: day5Err } = await supabaseAdmin
    .from("profiles")
    .select("id, email, owner_name, business_name")
    .eq("subscription_status", "trialing")
    .eq("sent_day5_email", false)
    .not("onboarded_at", "is", null)
    .lte("onboarded_at", fiveDaysAgo)
    .limit(BATCH_LIMIT);

  if (day5Err) {
    console.error("[cron/emails] day5 query error:", day5Err);
  }

  for (const profile of day5Users ?? []) {
    if (!profile.email) {
      results.day5.skipped++;
      continue;
    }
    try {
      await brevo.transactionalEmails.sendTransacEmail({
        templateId: TEMPLATE_PRO_DAY5,
        to: [
          {
            email: profile.email,
            name: profile.owner_name || profile.business_name || undefined,
          },
        ],
        params: {
          FIRSTNAME:     profile.owner_name    || "there",
          BUSINESS_NAME: profile.business_name || "your business",
        },
      });

      await supabaseAdmin
        .from("profiles")
        .update({ sent_day5_email: true, updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      results.day5.sent++;
    } catch (err) {
      console.error(`[cron/emails] day5 send failed for ${profile.id}:`, err);
      results.day5.failed++;
    }
  }

  console.log("[cron/emails] completed:", results);
  return NextResponse.json({ ok: true, results });
}
