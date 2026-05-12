import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Apply the plan to the profile for NEW accounts only.
      // We detect "new" by checking whether subscription_status is still null —
      // existing users (password reset, magic link re-login) already have a status.
      const userId = data.session.user.id;
      const plan = data.session.user.user_metadata?.plan as
        | "free"
        | "pro"
        | undefined;

      if (plan) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", userId)
          .single();

        if (!profile?.subscription_status) {
          if (plan === "pro") {
            const trialEnd = new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString();
            await supabase
              .from("profiles")
              .update({
                subscription_status: "trialing",
                trial_ends_at: trialEnd,
              })
              .eq("id", userId);
          } else {
            // Free tier — mark as expired so quota limits apply immediately.
            // Also clear trial_ends_at: the DB trigger sets it for all new
            // users, which would cause the trial banner to appear for free accounts.
            await supabase
              .from("profiles")
              .update({ subscription_status: "expired", trial_ends_at: null })
              .eq("id", userId);
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
