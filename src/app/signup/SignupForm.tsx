"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

// ── Beta badge shown on the signup form ───────────────────────────────────────

function PlanBadge({ plan: _ }: { plan: "free" | "pro" }) {
  return (
    <div
      className="mb-5 rounded-[12px] px-4 py-2.5 text-center text-[13px] font-medium"
      style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.2)",
        color: "#FBBF24",
      }}
    >
      Beta access · All features free · No credit card required
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function applyPlan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  plan: "free" | "pro",
  termsAgreedAt?: string,
  marketingOptedInAt?: string,
) {
  void plan;
  await supabase
    .from("profiles")
    .update({
      subscription_status: "expired",
      trial_ends_at: null,
      ...(termsAgreedAt ? { terms_agreed_at: termsAgreedAt } : {}),
      ...(marketingOptedInAt ? { marketing_opted_in_at: marketingOptedInAt } : {}),
    })
    .eq("id", userId);
}

// ── Screen types ──────────────────────────────────────────────────────────────

type Screen =
  | "choose"      // plan chooser (no ?plan param)
  | "signup"      // main sign-up form
  | "confirm"     // "check your inbox" after new signup
  | "duplicate"   // email already registered
  | "forgot"      // inline password reset form
  | "reset-sent"; // password reset email sent

// ── Main component ────────────────────────────────────────────────────────────

export function SignupForm({
  initialPlan,
}: {
  initialPlan: "free" | "pro" | null;
}) {
  const [screen, setScreen] = useState<Screen>(
    initialPlan === null ? "choose" : "signup"
  );
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">(
    initialPlan ?? "free"
  );

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Loading / error
  const [error, setError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // ── Sign-up submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!termsAgreed) {
      setTermsError("You must agree to the Terms of Service to create an account");
      return;
    }
    setTermsError("");
    setLoading(true);

    const termsAgreedAt = new Date().toISOString();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan: selectedPlan, terms_agreed_at: termsAgreedAt, marketing_opted_in: marketingOptIn },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Duplicate email detection
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setScreen("duplicate");
      return;
    }

    if (!data.session) {
      // Email confirmation required — plan will be applied in /auth/callback
      setScreen("confirm");
    } else {
      // Auto-confirmed — set profile to expired, then route based on plan
      const marketingOptedInAt = marketingOptIn ? new Date().toISOString() : undefined;
      await applyPlan(supabase, data.session.user.id, selectedPlan, termsAgreedAt, marketingOptedInAt);

      // Sync marketing preference to Brevo (fire-and-forget, non-blocking)
      fetch("/api/brevo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingOptIn }),
      }).catch(() => {});

      // BETA_MODE — remove bypass when beta ends; restore Pro→checkout path below
      if (selectedPlan === "pro" && process.env.NEXT_PUBLIC_BETA_MODE !== "true") {
        // Pro: redirect to Stripe checkout so a card is collected before trial starts
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        if (res.ok) {
          const { url } = await res.json();
          if (url) {
            window.location.href = url;
            return;
          }
        }
      }
      router.push("/onboarding");
      router.refresh();
    }
  }

  // ── Password reset submit ───────────────────────────────────────────────────

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setScreen("reset-sent");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Screen: Choose plan ─────────────────────────────────────────────────────

  if (screen === "choose") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>

          <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
            Join the beta
          </h1>
          <p className="text-sm text-qm-text-muted text-center mt-2 mb-8">
            All features free during beta. No credit card required.
          </p>

          <button
            onClick={() => {
              setSelectedPlan("free");
              setScreen("signup");
            }}
            className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold mb-6"
          >
            Join the beta free
          </button>

          <p className="text-sm text-qm-text-muted text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-qm-accent font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Confirm email ───────────────────────────────────────────────────

  if (screen === "confirm") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-qm-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-qm-text tracking-tight">
            Check your inbox
          </h1>
          <p className="text-sm text-qm-text-muted mt-3 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-qm-text">{email}</span>. Click
            it to activate your account and start building quotes.
          </p>

          <div
            className="mt-6 rounded-[14px] px-4 py-3 text-sm text-left"
            style={{
              background: "var(--color-qm-surface)",
              border: "1px solid var(--color-qm-border)",
            }}
          >
            <p className="text-qm-text-muted leading-relaxed">
              <strong className="text-qm-text">Can&apos;t find it?</strong>{" "}
              Check your spam folder, or{" "}
              <button
                onClick={handleSubmit as never}
                className="text-qm-accent font-semibold underline underline-offset-2"
              >
                resend the email
              </button>
              .
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-center">
            <p className="text-sm text-qm-text-muted">
              Wrong email?{" "}
              <button
                onClick={() => setScreen("signup")}
                className="text-qm-accent font-semibold"
              >
                Go back
              </button>
            </p>
            <p className="text-sm text-qm-text-muted">
              Already have an account?{" "}
              <a href="/login" className="text-qm-accent font-semibold">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Duplicate email ─────────────────────────────────────────────────

  if (screen === "duplicate") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--color-qm-warn-soft, #FEF3C7)" }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#D97706"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
            Account already exists
          </h1>
          <p className="text-sm text-qm-text-muted text-center mt-3 leading-relaxed">
            There&apos;s already an account using{" "}
            <span className="font-semibold text-qm-text">{email}</span>.
          </p>

          <a
            href={selectedPlan === "pro" ? "/login?next=stripe-pro" : "/login"}
            className="mt-6 w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold flex items-center justify-center"
          >
            Sign in to your account
          </a>

          <button
            onClick={() => {
              setError("");
              setScreen("forgot");
            }}
            className="mt-4 w-full h-12 rounded-[14px] text-[15px] font-semibold text-qm-text-muted"
            style={{
              border: "1px solid var(--color-qm-border)",
              background: "var(--color-qm-surface)",
            }}
          >
            Forgot your password?
          </button>

          <p className="text-sm text-qm-text-muted text-center mt-6">
            Not you?{" "}
            <button
              onClick={() => setScreen("signup")}
              className="text-qm-accent font-semibold"
            >
              Use a different email
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Forgot password ─────────────────────────────────────────────────

  if (screen === "forgot") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>

          <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
            Reset your password
          </h1>
          <p className="text-sm text-qm-text-muted text-center mt-2 leading-relaxed">
            We&apos;ll send a reset link to your email address.
          </p>

          <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
            {error && (
              <div className="bg-qm-danger-soft text-qm-danger text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="text-[13px] font-medium text-qm-text-muted block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-[52px] px-4 rounded-[14px] border border-qm-border bg-qm-surface text-qm-text text-[17px] outline-none focus:border-qm-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold tracking-tight disabled:opacity-45 transition-opacity"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="text-sm text-qm-text-muted text-center mt-6">
            <button
              onClick={() => setScreen("duplicate")}
              className="text-qm-accent font-semibold"
            >
              ← Back
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Reset sent ──────────────────────────────────────────────────────

  if (screen === "reset-sent") {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <AppLogo size="lg" />
          </div>

          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-qm-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-qm-text tracking-tight">
            Check your inbox
          </h1>
          <p className="text-sm text-qm-text-muted mt-3 leading-relaxed">
            We sent a password reset link to{" "}
            <span className="font-semibold text-qm-text">{email}</span>. It
            expires in 1 hour.
          </p>

          <p className="text-sm text-qm-text-muted mt-8">
            <Link href="/login" className="text-qm-accent font-semibold">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Screen: Signup form (default) ───────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <AppLogo size="lg" />
        </div>

        <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-qm-text-muted text-center mt-2 mb-6">
          Start building quotes in 60 seconds
        </p>

        {/* Plan badge */}
        <PlanBadge plan={selectedPlan} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-qm-danger-soft text-qm-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-[13px] font-medium text-qm-text-muted block mb-2">
              Full name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mike Henderson"
              required
              className="w-full h-[52px] px-4 rounded-[14px] border border-qm-border bg-qm-surface text-qm-text text-[17px] outline-none focus:border-qm-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-qm-text-muted block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-[52px] px-4 rounded-[14px] border border-qm-border bg-qm-surface text-qm-text text-[17px] outline-none focus:border-qm-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-[13px] font-medium text-qm-text-muted block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
              className="w-full h-[52px] px-4 rounded-[14px] border border-qm-border bg-qm-surface text-qm-text text-[17px] outline-none focus:border-qm-accent transition-colors"
            />
          </div>

          {/* Terms of Service checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-[2px] shrink-0">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked);
                    if (e.target.checked) setTermsError("");
                  }}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center transition-colors"
                  style={{
                    background: termsAgreed ? "var(--color-qm-accent)" : "var(--color-qm-surface)",
                    border: `1.5px solid ${termsAgreed ? "var(--color-qm-accent)" : termsError ? "var(--color-qm-danger)" : "var(--color-qm-border-strong)"}`,
                  }}
                >
                  {termsAgreed && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[13px] text-qm-text-muted leading-[1.45]">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-qm-accent font-semibold underline underline-offset-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service
                </a>
              </span>
            </label>
            {termsError && (
              <p className="mt-2 text-[12px] font-medium" style={{ color: "var(--color-qm-danger)" }}>
                {termsError}
              </p>
            )}
          </div>

          {/* Marketing opt-in checkbox (optional) */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-[2px] shrink-0">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="w-5 h-5 rounded-[5px] flex items-center justify-center transition-colors"
                  style={{
                    background: marketingOptIn ? "var(--color-qm-accent)" : "var(--color-qm-surface)",
                    border: `1.5px solid ${marketingOptIn ? "var(--color-qm-accent)" : "var(--color-qm-border-strong)"}`,
                  }}
                >
                  {marketingOptIn && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[13px] text-qm-text-muted leading-[1.45]">
                Send me tips and product updates from QuoteMate
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold tracking-tight disabled:opacity-45 transition-opacity"
          >
            {loading ? "Creating account..." : "Join the beta free"}
          </button>
        </form>

        <p className="text-sm text-qm-text-muted text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-qm-accent font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
