"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-qm-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-[14px] bg-qm-accent flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
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
          Welcome back
        </h1>
        <p className="text-sm text-qm-text-muted text-center mt-2">
          Sign in to your QuoteMate account
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

          <div>
            <label className="text-[13px] font-medium text-qm-text-muted block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-[52px] px-4 rounded-[14px] border border-qm-border bg-qm-surface text-qm-text text-[17px] outline-none focus:border-qm-accent transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold tracking-tight disabled:opacity-45 transition-opacity"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-qm-text-muted text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-qm-accent font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
