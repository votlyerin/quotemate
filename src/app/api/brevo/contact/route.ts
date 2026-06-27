import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { BrevoClient } from "@getbrevo/brevo";

// NOTE: Before this works, create a boolean contact attribute named
// MARKETING_OPT_IN in Brevo: Contacts → Contact Attributes → Add new attribute.

export async function POST(req: NextRequest) {
  const brevoApiKey = process.env.BREVO_API_KEY;
  if (!brevoApiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
  }

  // Auth check — user must be logged in
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { marketingOptIn } = await req.json() as { marketingOptIn: boolean };

  try {
    const brevo = new BrevoClient({ apiKey: brevoApiKey });
    await brevo.contacts.createContact({
      email: user.email,
      attributes: { MARKETING_OPT_IN: marketingOptIn },
      updateEnabled: true,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Non-fatal — log but don't block signup
    console.error("[brevo/contact] sync failed:", err);
    return NextResponse.json({ ok: true, warning: "Brevo sync failed" });
  }
}
