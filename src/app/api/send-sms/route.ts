import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import { LOAD_LABELS } from "@/lib/quote-calc";

export async function POST(req: NextRequest) {
  try {
    const { quoteId } = await req.json();
    if (!quoteId) {
      return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
    }

    // ── Auth check ──────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Fetch quote + profile via service role ───────────────────────────────
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: quote, error: quoteErr }, { data: profile }] =
      await Promise.all([
        supabaseAdmin
          .from("quotes")
          .select("*")
          .eq("id", quoteId)
          .eq("user_id", user.id)
          .single(),
        supabaseAdmin
          .from("profiles")
          .select("business_name, quote_expiry_days")
          .eq("id", user.id)
          .single(),
      ]);

    if (quoteErr || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (!quote.customer_phone) {
      return NextResponse.json(
        { error: "No phone number saved on this quote. Add a phone number before sending." },
        { status: 400 }
      );
    }

    // ── Build message ────────────────────────────────────────────────────────
    const businessName = profile?.business_name || "Your Junk Removal Pro";
    const expiryDays = profile?.quote_expiry_days ?? 7;
    const loadLabel =
      LOAD_LABELS[quote.load_size ?? ""] || quote.load_size || "junk removal";
    const finalPrice = quote.final_price ?? quote.recommended_price ?? 0;
    const customerName = quote.customer_name || "there";

    const message =
      `Hi ${customerName}, here's your quote from ${businessName}: ` +
      `$${finalPrice} for ${loadLabel} junk removal. ` +
      `Valid for ${expiryDays} days. ` +
      `Call or text us back to confirm.`;

    // ── Twilio config check ──────────────────────────────────────────────────
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "SMS is not configured. Add Twilio credentials to .env.local." },
        { status: 500 }
      );
    }

    // ── Send ─────────────────────────────────────────────────────────────────
    const twilioClient = twilio(accountSid, authToken);
    await twilioClient.messages.create({
      body: message,
      to: quote.customer_phone,
      from: fromNumber,
    });

    // ── Update quote status ──────────────────────────────────────────────────
    await supabaseAdmin
      .from("quotes")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", quoteId);

    return NextResponse.json({ success: true, message });
  } catch (err: unknown) {
    console.error("[send-sms]", err);
    const msg =
      err instanceof Error ? err.message : "Failed to send SMS";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
