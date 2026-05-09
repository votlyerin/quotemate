import { getEffectiveSubStatus } from "./subscription";
import type { Profile } from "@/types/database";

/** Returns "pro" for any active/trialing state, "free" otherwise. */
export function getTier(profile: Partial<Profile> | null): "free" | "pro" {
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
