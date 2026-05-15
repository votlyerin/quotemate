import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getEffectiveSubStatus, trialDaysLeft } from "@/lib/subscription";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** ISO string N days from now */
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

/** ISO string N days ago */
function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

// ─── getEffectiveSubStatus ────────────────────────────────────────────────────

describe("getEffectiveSubStatus", () => {
  it("returns 'active' when status is active", () => {
    expect(getEffectiveSubStatus({ subscription_status: "active" })).toBe("active");
  });

  it("returns 'past_due' when status is past_due", () => {
    expect(getEffectiveSubStatus({ subscription_status: "past_due" })).toBe("past_due");
  });

  it("returns 'trialing' when status is null (new account, no trial_ends_at)", () => {
    expect(getEffectiveSubStatus({ subscription_status: null })).toBe("trialing");
  });

  it("returns 'trialing' when status is undefined", () => {
    expect(getEffectiveSubStatus({})).toBe("trialing");
  });

  it("returns 'trialing' when status is 'trialing' with trial_ends_at in future (>5 days)", () => {
    expect(
      getEffectiveSubStatus({
        subscription_status: "trialing",
        trial_ends_at: daysFromNow(10),
      })
    ).toBe("trialing");
  });

  it("returns 'trial_ending' when trial ends within 5 days", () => {
    expect(
      getEffectiveSubStatus({
        subscription_status: "trialing",
        trial_ends_at: daysFromNow(3),
      })
    ).toBe("trial_ending");
  });

  it("returns 'trial_ending' when trial ends in exactly 1 day", () => {
    expect(
      getEffectiveSubStatus({
        subscription_status: "trialing",
        trial_ends_at: daysFromNow(1),
      })
    ).toBe("trial_ending");
  });

  it("returns 'expired' when trial_ends_at is in the past", () => {
    expect(
      getEffectiveSubStatus({
        subscription_status: "trialing",
        trial_ends_at: daysAgo(1),
      })
    ).toBe("expired");
  });

  it("returns 'expired' when status is 'canceled'", () => {
    expect(getEffectiveSubStatus({ subscription_status: "canceled" })).toBe("expired");
  });

  it("returns 'expired' when status is 'expired'", () => {
    expect(getEffectiveSubStatus({ subscription_status: "expired" })).toBe("expired");
  });
});

// ─── trialDaysLeft ────────────────────────────────────────────────────────────

describe("trialDaysLeft", () => {
  it("returns 0 for null", () => {
    expect(trialDaysLeft(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(trialDaysLeft(undefined)).toBe(0);
  });

  it("returns 0 when trial already ended", () => {
    expect(trialDaysLeft(daysAgo(2))).toBe(0);
  });

  it("returns correct days for future trial end", () => {
    expect(trialDaysLeft(daysFromNow(7))).toBe(7);
  });

  it("returns 1 for trial ending tomorrow", () => {
    expect(trialDaysLeft(daysFromNow(1))).toBe(1);
  });

  it("returns 14 for a fresh trial", () => {
    expect(trialDaysLeft(daysFromNow(14))).toBe(14);
  });
});
