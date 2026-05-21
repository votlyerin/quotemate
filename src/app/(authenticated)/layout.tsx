import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PaywallGate } from "@/components/PaywallGate";
import { getEffectiveSubStatus, trialDaysLeft } from "@/lib/subscription";
import type { Profile } from "@/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let subStatus: ReturnType<typeof getEffectiveSubStatus> = "active";
  let daysLeft = 0;

  if (isSupabaseConfigured()) {
    // ── Auth check ────────────────────────────────────────────────────────────
    // IMPORTANT: redirect() throws a special NEXT_REDIRECT error internally.
    // Calling it inside a try/catch causes the catch block to intercept it and
    // redirect to /login instead of the intended destination. All redirect()
    // calls must live OUTSIDE the try/catch so they propagate correctly.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let user: any = null;
    let profile: { subscription_status: string | null; trial_ends_at: string | null; stripe_customer_id: string | null; onboarded_at: string | null } | null = null;

    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "subscription_status, trial_ends_at, stripe_customer_id, onboarded_at"
          )
          .eq("id", user.id)
          .single();
        profile = profileData;
      }
    } catch {
      // Network / DB error — treat as unauthenticated
      redirect("/login");
    }

    // redirect() calls are outside try/catch so NEXT_REDIRECT propagates cleanly
    if (!user) {
      redirect("/login");
    }

    if (profile) {
      if (!profile.onboarded_at) {
        redirect("/onboarding");
      }
      subStatus = getEffectiveSubStatus(profile as Partial<Profile>);
      daysLeft = trialDaysLeft(profile.trial_ends_at ?? null);
    }
  }

  // Subscription gate — past_due blocks access (payment must be updated)
  // Expired users still get access as free-tier (5 quotes/month, limited history)
  if (subStatus === "past_due") {
    return (
      <div className="min-h-dvh bg-qm-bg">
        <div className="max-w-md mx-auto">
          <PaywallGate isPastDue={true} />
        </div>
      </div>
    );
  }

  // isPro controls feature access — trial_ending users still have full Pro access
  const isPro =
    subStatus === "active" ||
    subStatus === "trialing" ||
    subStatus === "trial_ending";

  // Banner only appears when a Pro trial is specifically in its last 5 days
  // (trial_ending). Never shows for free/expired users even if trial_ends_at
  // happens to be set by the DB trigger.
  const showTrialBanner = subStatus === "trialing" || subStatus === "trial_ending";

  return (
    <div className="min-h-dvh bg-qm-bg">
      {showTrialBanner && (
        <div
          className="sticky top-0 z-50 w-full"
          style={{ background: "var(--color-qm-warn)" }}
        >
          <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between gap-3">
            <span className="text-[13px] font-semibold text-white">
              {daysLeft === 1
                ? "Last day of your free trial!"
                : `${daysLeft} days left in your trial`}
            </span>
            <TrialBannerButton />
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto min-h-dvh pb-[92px]">{children}</div>
      <BottomNav />
    </div>
  );
}

// Small client button inside the server layout banner
function TrialBannerButton() {
  // This is a server component — render a link to /settings instead
  return (
    <a
      href="/settings"
      className="text-[12px] font-bold text-white underline underline-offset-2 shrink-0"
    >
      Subscribe →
    </a>
  );
}
