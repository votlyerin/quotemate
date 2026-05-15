/**
 * Webhook handler tests.
 *
 * Strategy: mock stripe.webhooks.constructEvent to skip signature verification
 * and mock the Supabase admin client to capture DB writes without a real DB.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Stripe ──────────────────────────────────────────────────────────────

const mockConstructEvent = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockConstructEvent },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  },
  getSupabaseAdmin: () => mockSupabase,
}));

// ─── Mock Supabase admin ──────────────────────────────────────────────────────

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
const mockEq = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });

// Build a chainable mock: supabase.from(...).update(...).eq(...).eq(...)
// Supports unlimited chained .eq() calls (invoice.paid uses two).
function makeMockSupabase() {
  // Each .eq() returns an object that also has an .eq() so chains work
  function makeEq(): ReturnType<typeof vi.fn> {
    const eq: ReturnType<typeof vi.fn> = vi.fn().mockImplementation(() => ({
      eq: makeEq(),
    }));
    // Also make the eq itself awaitable (resolve with {})
    eq.mockResolvedValue = undefined as unknown as typeof eq.mockResolvedValue;
    // Override: return a thenable so `await supabase.from().update().eq().eq()` works
    const thenableEq: ReturnType<typeof vi.fn> = vi.fn().mockImplementation(
      () => Object.assign(Promise.resolve({}), { eq: makeEq() })
    );
    return thenableEq;
  }

  const eq1 = vi.fn().mockImplementation(
    () => Object.assign(Promise.resolve({}), { eq: makeEq() })
  );
  const updateFn = vi.fn().mockReturnValue({ eq: eq1 });
  const fromFn = vi.fn().mockReturnValue({ update: updateFn });
  return { from: fromFn, _update: updateFn, _eq: eq1 };
}

let mockSupabase: ReturnType<typeof makeMockSupabase>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabase = makeMockSupabase();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: object) {
  const str = JSON.stringify(body);
  return new Request("https://example.com/api/stripe/webhook", {
    method: "POST",
    body: str,
    headers: { "stripe-signature": "test_sig" },
  });
}

async function callWebhook(event: object) {
  mockConstructEvent.mockReturnValue(event);
  const { POST } = await import("@/app/api/stripe/webhook/route");
  const req = makeRequest(event);
  return POST(req);
}

function lastUpdateCall() {
  return mockSupabase._update.mock.calls[0]?.[0];
}

function lastEqArgs() {
  return mockSupabase._eq.mock.calls[0];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/stripe/webhook", () => {
  // ── Signature guard ──────────────────────────────────────────────────────

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = new Request("https://example.com/api/stripe/webhook", {
      method: "POST",
      body: "{}",
      // no stripe-signature
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when constructEvent throws (invalid signature)", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("No signatures found");
    });
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = makeRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── checkout.session.completed ───────────────────────────────────────────

  it("sets status to 'trialing' when checkout subscription is trialing", async () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 14 * 86400;
    mockSubscriptionsRetrieve.mockResolvedValue({
      status: "trialing",
      trial_end: trialEnd,
    });

    const res = await callWebhook({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-123",
          customer: "cus_abc",
          subscription: "sub_xyz",
        },
      },
    });

    expect(res.status).toBe(200);
    const payload = lastUpdateCall();
    expect(payload.subscription_status).toBe("trialing");
    expect(payload.has_used_trial).toBe(true);
    expect(payload.trial_ends_at).toBe(new Date(trialEnd * 1000).toISOString());
  });

  it("sets status to 'active' when checkout subscription is not trialing", async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({
      status: "active",
      trial_end: null,
    });

    const res = await callWebhook({
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "user-123",
          customer: "cus_abc",
          subscription: "sub_xyz",
        },
      },
    });

    expect(res.status).toBe(200);
    const payload = lastUpdateCall();
    expect(payload.subscription_status).toBe("active");
    expect(payload.has_used_trial).toBe(true);
    expect(payload.trial_ends_at).toBeUndefined();
  });

  it("does nothing when client_reference_id is missing", async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({ status: "active", trial_end: null });

    const res = await callWebhook({
      type: "checkout.session.completed",
      data: { object: { customer: "cus_abc", subscription: "sub_xyz" } },
    });

    expect(res.status).toBe(200);
    expect(mockSupabase._update).not.toHaveBeenCalled();
  });

  // ── customer.subscription.updated ───────────────────────────────────────

  const updatedCases = [
    { stripeStatus: "active",    dbStatus: "active" },
    { stripeStatus: "trialing",  dbStatus: "trialing" },
    { stripeStatus: "past_due",  dbStatus: "past_due" },
    { stripeStatus: "canceled",  dbStatus: "canceled" },
    { stripeStatus: "unpaid",    dbStatus: "expired" },
    { stripeStatus: "incomplete", dbStatus: "expired" },
  ] as const;

  for (const { stripeStatus, dbStatus } of updatedCases) {
    it(`maps Stripe status '${stripeStatus}' → db status '${dbStatus}'`, async () => {
      const res = await callWebhook({
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_xyz",
            customer: "cus_abc",
            status: stripeStatus,
            trial_end: null,
          },
        },
      });

      expect(res.status).toBe(200);
      expect(lastUpdateCall().subscription_status).toBe(dbStatus);
    });
  }

  it("writes trial_ends_at when subscription is trialing and trial_end is set", async () => {
    const trialEnd = Math.floor(Date.now() / 1000) + 7 * 86400;

    const res = await callWebhook({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_xyz",
          customer: "cus_abc",
          status: "trialing",
          trial_end: trialEnd,
        },
      },
    });

    expect(res.status).toBe(200);
    const payload = lastUpdateCall();
    expect(payload.trial_ends_at).toBe(new Date(trialEnd * 1000).toISOString());
  });

  it("does NOT write trial_ends_at for non-trialing subscription.updated", async () => {
    const res = await callWebhook({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_xyz",
          customer: "cus_abc",
          status: "active",
          trial_end: null,
        },
      },
    });

    expect(res.status).toBe(200);
    expect(lastUpdateCall().trial_ends_at).toBeUndefined();
  });

  // ── customer.subscription.deleted ───────────────────────────────────────

  it("sets status to 'canceled' and nulls subscription_id on deletion", async () => {
    const res = await callWebhook({
      type: "customer.subscription.deleted",
      data: {
        object: { id: "sub_xyz", customer: "cus_abc", status: "canceled" },
      },
    });

    expect(res.status).toBe(200);
    const payload = lastUpdateCall();
    expect(payload.subscription_status).toBe("canceled");
    expect(payload.subscription_id).toBeNull();
  });

  // ── invoice.payment_failed ───────────────────────────────────────────────

  it("sets status to 'past_due' on payment failure", async () => {
    const res = await callWebhook({
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_abc" } },
    });

    expect(res.status).toBe(200);
    expect(lastUpdateCall().subscription_status).toBe("past_due");
  });

  // ── invoice.paid ─────────────────────────────────────────────────────────

  it("sets status to 'active' on successful payment recovery", async () => {
    const res = await callWebhook({
      type: "invoice.paid",
      data: { object: { customer: "cus_abc" } },
    });

    expect(res.status).toBe(200);
    expect(lastUpdateCall().subscription_status).toBe("active");
  });

  // ── Unknown event ─────────────────────────────────────────────────────────

  it("returns 200 and ignores unknown event types", async () => {
    const res = await callWebhook({
      type: "payment_intent.created",
      data: { object: {} },
    });

    expect(res.status).toBe(200);
    expect(mockSupabase._update).not.toHaveBeenCalled();
  });
});
