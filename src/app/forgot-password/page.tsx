"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/AppLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (err) {
        setError(err.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <AppLogo size="lg" />
        </div>

        {sent ? (
          <>
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
            <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
              Check your inbox
            </h1>
            <p className="text-sm text-qm-text-muted text-center mt-2 leading-relaxed">
              We sent a reset link to{" "}
              <span className="font-semibold text-qm-text">{email}</span>. Click
              it to set a new password — it&apos;s valid for 1 hour.
            </p>
            <p className="text-sm text-qm-text-muted text-center mt-6">
              <Link href="/login" className="text-qm-accent font-semibold">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
              Forgot password?
            </h1>
            <p className="text-sm text-qm-text-muted text-center mt-2">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
              <Link href="/login" className="text-qm-accent font-semibold">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
