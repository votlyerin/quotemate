"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Logo ──────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className="flex justify-center mb-8">
      <div className="w-14 h-14 rounded-[14px] bg-qm-accent flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <path
            d="M13 14h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H17l-4 3v-3h-1a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2z"
            fill="white"
            opacity="0.2"
          />
          <path
            d="M19.5 16.5c-2.2 0-3.7 1.2-3.7 3 0 3.4 5.4 2 5.4 3.7 0 .6-.7 1-1.7 1s-1.8-.4-2.2-1.2"
            stroke="#fff"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M19.5 15v1.5M19.5 23.2v1.5"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ── Plan badge shown on the signup form ───────────────────────────────────────

function PlanBadge({ plan }: { plan: "free" | "pro" }) {
  if (plan === "pro") {
    return (
      <div
        className="mb-5 rounded-[12px] px-4 py-2.5 text-center text-[13px] font-medium"
        style={{
          background: "var(--color-qm-accent-soft)",
          border: "1px solid rgba(16,185,129,0.2)",
          color: "var(--color-qm-accent-dark)",
        }}
      >
        ✓ Pro plan — 14-day free trial, then $19/month · No card needed
      </div>
    );
  }
  return (
    <div
      className="mb-5 rounded-[12px] px-4 py-2.5 text-center text-[13px] font-medium"
      style={{
        background: "var(--color-qm-surface-alt)",
        border: "1px solid var(--color-qm-border)",
        color: "var(--color-qm-text-muted)",
      }}
    >
      Free plan — up to 5 quotes/month · No credit card ever
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function applyPlan(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  plan: "free" | "pro"
) {
  if (plan === "pro") {
    const trialEnd = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    await supabase
      .from("profiles")
      .update({ subscription_status: "trialing", trial_ends_at: trialEnd })
      .eq("id", userId);
  } else {
    await supabase
      .from("profiles")
      .update({ subscription_status: "expired" })
      .eq("id", userId);
  }
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

  // Loading / error
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // ── Sign-up submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan: selectedPlan },
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
      // Auto-confirmed — apply plan now, then go to onboarding
      await applyPlan(supabase, data.session.user.id, selectedPlan);
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
          <Logo />

          <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
            Choose your plan
          </h1>
          <p className="text-sm text-qm-text-muted text-center mt-2 mb-8">
            Start free, upgrade anytime — no credit card required.
          </p>

          {/* Free card */}
          <button
            onClick={() => {
              setSelectedPlan("free");
              setScreen("signup");
            }}
            className="w-full text-left rounded-[18px] p-5 mb-3 transition-shadow"
            style={{
              background: "var(--color-qm-surface)",
              border: "1.5px solid var(--color-qm-border)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold text-qm-text">Free</p>
                <p
                  className="text-[22px] font-bold tracking-tight mt-0.5"
                  style={{ color: "var(--color-qm-text)" }}
                >
                  $0
                  <span className="text-[14px] font-normal text-qm-text-muted">
                    /month
                  </span>
                </p>
              </div>
              <span
                className="text-[12px] font-semibold px-2.5 py-1 rounded-full mt-1 shrink-0"
                style={{
                  background: "var(--color-qm-surface-alt)",
                  color: "var(--color-qm-text-muted)",
                }}
              >
                Always free
              </span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                "5 quotes per month",
                "Instant quote calculator",
                "Profit margin tracking",
                "Quote history (last 5)",
              ].map((f) => (
                <li
                  key={f}
                  className="text-[13px] text-qm-text-muted flex items-center gap-2"
                >
                  <span style={{ color: "var(--color-qm-accent)" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div
              className="mt-4 w-full h-11 rounded-[12px] flex items-center justify-center text-[14px] font-semibold"
              style={{
                border: "1.5px solid var(--color-qm-border-strong)",
                color: "var(--color-qm-text)",
              }}
            >
              Get started free →
            </div>
          </button>

          {/* Pro card */}
          <button
            onClick={() => {
              setSelectedPlan("pro");
              setScreen("signup");
            }}
            className="w-full text-left rounded-[18px] p-5 mb-6 relative overflow-hidden"
            style={{
              background: "#0E1414",
              border: "1.5px solid rgba(16,185,129,0.3)",
            }}
          >
            <div
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10.5px] font-bold"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "var(--color-qm-accent)",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              14-day free trial
            </div>
            <div className="flex items-start gap-3">
              <div>
                <p
                  className="text-[15px] font-bold"
                  style={{ color: "var(--color-qm-accent)" }}
                >
                  Pro
                </p>
                <p className="text-[22px] font-bold tracking-tight mt-0.5 text-white">
                  $19
                  <span className="text-[14px] font-normal text-white opacity-45">
                    /month
                  </span>
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {[
                "Unlimited quotes",
                "Email & SMS delivery",
                "Custom pricing defaults",
                "Surcharge builder + truckload tiers",
                "Full quote history",
              ].map((f) => (
                <li
                  key={f}
                  className="text-[13px] flex items-center gap-2"
                  style={{ color: "rgba(244,246,244,0.7)" }}
                >
                  <span style={{ color: "var(--color-qm-accent)" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <div
              className="mt-4 w-full h-11 rounded-[12px] flex items-center justify-center text-[14px] font-semibold text-white"
              style={{ background: "var(--color-qm-accent)" }}
            >
              Start free trial →
            </div>
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
          <Logo />

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
            it to activate your account and start your{" "}
            {selectedPlan === "pro" ? "14-day free trial" : "free account"}.
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
          <Logo />

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
            href="/login"
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
          <Logo />

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
          <Logo />

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
        <Logo />

        <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-qm-text-muted text-center mt-2 mb-6">
          {selectedPlan === "pro"
            ? "Start your 14-day free trial — no card needed"
            : "Start building quotes in 60 seconds"}
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

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold tracking-tight disabled:opacity-45 transition-opacity"
          >
            {loading
              ? "Creating account..."
              : selectedPlan === "pro"
              ? "Start free trial"
              : "Get started free"}
          </button>
        </form>

        {/* Switch plan link */}
        <p className="text-sm text-qm-text-muted text-center mt-4">
          {selectedPlan === "pro" ? (
            <>
              Want the free plan?{" "}
              <button
                onClick={() => setSelectedPlan("free")}
                className="text-qm-accent font-semibold"
              >
                Switch to Free
              </button>
            </>
          ) : (
            <>
              Want the Pro trial?{" "}
              <button
                onClick={() => setSelectedPlan("pro")}
                className="text-qm-accent font-semibold"
              >
                Start 14-day trial
              </button>
            </>
          )}
        </p>

        <p className="text-sm text-qm-text-muted text-center mt-3">
          Already have an account?{" "}
          <Link href="/login" className="text-qm-accent font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
