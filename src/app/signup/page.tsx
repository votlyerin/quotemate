"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (!data.session) {
      // Email confirmation required — session won't exist until they click the link
      setNeedsConfirmation(true);
      setLoading(false);
    } else {
      // Confirmation disabled or auto-confirmed — session exists, go straight to onboarding
      router.push("/onboarding");
      router.refresh();
    }
  }

  if (needsConfirmation) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
        <div className="w-full max-w-sm text-center">
          {/* Logo */}
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
            it to activate your account and start your 14-day free trial.
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

          <p className="text-sm text-qm-text-muted mt-6">
            Wrong email?{" "}
            <button
              onClick={() => setNeedsConfirmation(false)}
              className="text-qm-accent font-semibold"
            >
              Go back
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
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

        <h1 className="text-2xl font-bold text-qm-text text-center tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-qm-text-muted text-center mt-2">
          Start building quotes in 60 seconds
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            {loading ? "Creating account..." : "Get started"}
          </button>
        </form>

        <p className="text-sm text-qm-text-muted text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-qm-accent font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
