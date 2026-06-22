import { getEffectiveSubStatus } from "./subscription";
import type { Profile } from "@/types/database";
import { BETA_MODE } from "./beta";

/** Returns "pro" for any active/trialing state, "free" otherwise. */
export function getTier(profile: Partial<Profile> | null): "free" | "pro" {
  // BETA_MODE — remove bypass when beta ends
  if (BETA_MODE) return "pro";
  if (!profile) return "free";
  const status = getEffectiveSubStatus(profile);
  if (
    status === "active" ||
    status === "trialing" ||
    status === "trial_ending"
  ) {
    return "pro";
  }
  return "free";
}
