import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { BrevoClient } from "@getbrevo/brevo";
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
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
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
          .select("business_name, owner_name, phone, email, quote_expiry_days")
          .eq("id", user.id)
          .single(),
      ]);

    if (quoteErr || !quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (!quote.customer_email) {
      return NextResponse.json(
        { error: "No email address saved on this quote. Add an email before sending." },
        { status: 400 }
      );
    }

    // ── Brevo config check ───────────────────────────────────────────────────
    const brevoApiKey = process.env.BREVO_API_KEY;
    const fromEmail = process.env.BREVO_SENDING_EMAIL || "quotes@goquotemate.com";

    if (!brevoApiKey) {
      return NextResponse.json(
        { error: "Email is not configured. Add BREVO_API_KEY to .env.local." },
        { status: 500 }
      );
    }

    // ── Build content ────────────────────────────────────────────────────────
    const businessName = profile?.business_name || "Your Junk Removal Pro";
    const ownerName = profile?.owner_name || businessName;
    const businessPhone = profile?.phone || "";
    const businessEmail = profile?.email || "";
    const expiryDays = profile?.quote_expiry_days ?? 7;
    const loadLabel =
      LOAD_LABELS[quote.load_size ?? ""] || quote.load_size || "Junk removal";
    const finalPrice = quote.final_price ?? quote.recommended_price ?? 0;
    const customerName = quote.customer_name || "there";
    const rawJobType = quote.job_type || "Junk removal";
    const expDate = new Date(Date.now() + expiryDays * 86_400_000).toLocaleDateString(
      "en-US",
      { month: "long", day: "numeric", year: "numeric" }
    );

    // ── HTML email ───────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your quote from ${businessName}</title>
</head>
<body style="margin:0;padding:0;background:#F0F2F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F2F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#10B981;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="display:inline-block;width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:12px;text-align:center;line-height:44px;font-size:20px;font-weight:800;color:#fff;vertical-align:middle;">Q</div>
                  </td>
                  <td style="padding-left:14px;vertical-align:middle;">
                    <div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">${businessName}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;">Your quote is ready</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 0;">
              <p style="margin:0;font-size:16px;color:#374151;">Hi ${customerName},</p>
              <p style="margin:10px 0 0;font-size:14px;color:#6B7280;line-height:1.6;">
                Thanks for reaching out! Here's your quote for ${rawJobType.toLowerCase()}.
              </p>
            </td>
          </tr>

          <!-- Price hero -->
          <tr>
            <td style="padding:20px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1414;border-radius:16px;">
                <tr>
                  <td style="padding:24px;">
                    <div style="font-size:11px;font-weight:600;color:#10B981;text-transform:uppercase;letter-spacing:0.5px;">Total quote</div>
                    <div style="font-size:52px;font-weight:800;color:#ffffff;letter-spacing:-2px;line-height:1.1;margin-top:4px;">$${finalPrice}</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:6px;">${loadLabel} &middot; Valid until ${expDate}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Job details -->
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="font-size:11px;font-weight:600;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">Job summary</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:14px;overflow:hidden;">
                ${quote.customer_address ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #E5E7EB;">
                    <div style="font-size:12px;color:#6B7280;">Address</div>
                    <div style="font-size:14px;font-weight:500;color:#111827;margin-top:2px;">${quote.customer_address}</div>
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #E5E7EB;">
                    <div style="font-size:12px;color:#6B7280;">Job type</div>
                    <div style="font-size:14px;font-weight:500;color:#111827;margin-top:2px;">${rawJobType}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #E5E7EB;">
                    <div style="font-size:12px;color:#6B7280;">Load size</div>
                    <div style="font-size:14px;font-weight:500;color:#111827;margin-top:2px;">${loadLabel}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <div style="font-size:12px;color:#6B7280;">What's included</div>
                    <div style="font-size:14px;font-weight:500;color:#111827;margin-top:2px;">Loading, hauling &amp; all disposal fees</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry notice -->
          <tr>
            <td style="padding:16px 32px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7E6;border:1px solid #FFE8B2;border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;font-size:13px;color:#92400E;">
                    &#9200; <strong>This quote expires on ${expDate}.</strong>
                    Reply to this email or call us to book your pickup.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA note -->
          <tr>
            <td style="padding:24px 32px 0;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                Ready to book? Just reply to this email${businessPhone ? ` or call us at <strong>${businessPhone}</strong>` : ""} and we'll get you on the schedule.
              </p>
            </td>
          </tr>

          <!-- Terms -->
          <tr>
            <td style="padding:16px 32px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3F4F6;border-radius:10px;">
                <tr>
                  <td style="padding:12px 14px;font-size:11px;color:#9CA3AF;line-height:1.5;">
                    <strong style="color:#6B7280;">Terms:</strong> Quote valid for ${expiryDays} days. Final price may change if job scope changes on-site. Payment due on completion.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #E5E7EB;padding:18px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;color:#374151;">${ownerName} &middot; ${businessName}</p>
              ${businessPhone ? `<p style="margin:4px 0 0;font-size:12px;color:#9CA3AF;">${businessPhone}</p>` : ""}
              ${businessEmail ? `<p style="margin:2px 0 0;font-size:12px;color:#9CA3AF;">${businessEmail}</p>` : ""}
              <p style="margin:12px 0 0;font-size:11px;color:#D1D5DB;">Sent via QuoteMate</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // ── Send via Brevo ───────────────────────────────────────────────────────
    const brevo = new BrevoClient({ apiKey: brevoApiKey });

    await brevo.transactionalEmails.sendTransacEmail({
      subject: `Your quote from ${businessName} — $${finalPrice}`,
      htmlContent: html,
      sender: {
        name: `${businessName} via QuoteMate`,
        email: fromEmail,
      },
      replyTo: {
        email: profile?.email || user.email!,
        name: businessName,
      },
      to: [
        {
          email: quote.customer_email,
          ...(quote.customer_name ? { name: quote.customer_name } : {}),
        },
      ],
    });

    // ── Update quote status ──────────────────────────────────────────────────
    await supabaseAdmin
      .from("quotes")
      .update({ status: "sent", updated_at: new Date().toISOString() })
      .eq("id", quoteId);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[send-email]", err);
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
