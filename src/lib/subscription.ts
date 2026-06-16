/**
 * Pure helpers for subscription status — safe to import on both client and server.
 * Does NOT import Stripe SDK.
 */

export function getEffectiveSubStatus(profile: {
  subscription_status?: string | null;
  trial_ends_at?: string | null;
}): "active" | "trialing" | "trial_ending" | "past_due" | "expired" {
  const status = profile.subscription_status;

  if (status === "active") return "active";
  if (status === "past_due") return "past_due";

  if (!status || status === "trialing") {
    const trialEnd = profile.trial_ends_at;
    if (!trialEnd) return "expired";
    const now = Date.now();
    const end = new Date(trialEnd).getTime();
    if (end <= now) return "expired";
    const daysLeft = Math.ceil((end - now) / 86_400_000);
    return daysLeft <= 5 ? "trial_ending" : "trialing";
  }

  return "expired";
}

export function trialDaysLeft(
  trialEndsAt: string | null | undefined
): number {
  if (!trialEndsAt) return 0;
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
