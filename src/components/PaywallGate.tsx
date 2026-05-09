"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";

const FEATURES = [
  "Create unlimited professional quotes",
  "Smart margin calculator & price floors",
  "Track accepted, declined & sent quotes",
  "Send quotes via SMS, email, or link",
  "Custom truckload & complexity pricing",
];

export function PaywallGate({ isPastDue = false }: { isPastDue?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  async function handlePortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-qm-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        {/* Logo */}
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center shadow-lg"
          style={{ background: "var(--color-qm-accent)" }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
          >
            <path
              d="M13 14h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H17l-4 3v-3h-1a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2z"
              fill="white"
              opacity="0.2"
            />
            <path
              d="M19.5 16.5c-2.2 0-3.7 1.2-3.7 3 0 3.4 5.4 2 5.4 3.7 0 .6-.7 1-1.7 1s-1.8-.4-2.2-1.2"
              stroke="white"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M19.5 15v1.5M19.5 23.2v1.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Headline */}
        <div className="text-center">
          <h1 className="text-[26px] font-bold text-qm-text tracking-[-0.6px] leading-tight">
            {isPastDue
              ? "Payment failed"
              : "Your trial has ended"}
          </h1>
          <p className="text-[15px] text-qm-text-muted mt-2 leading-relaxed">
            {isPastDue
              ? "Update your payment method to keep using QuoteMate."
              : "Subscribe to keep creating professional quotes for your business."}
          </p>
        </div>

        {/* Features */}
        {!isPastDue && (
          <div className="w-full bg-qm-surface border border-qm-border rounded-2xl p-4">
            <div className="flex flex-col gap-[10px]">
              {FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-[1px]"
                    style={{ background: "var(--color-qm-accent-soft)" }}
                  >
                    <Check
                      size={11}
                      strokeWidth={3}
                      style={{ color: "var(--color-qm-accent-dark)" }}
                    />
                  </div>
                  <span className="text-[14px] text-qm-text font-medium leading-snug">
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "#0E1414" }}
        >
          <div>
            <div className="text-[13px] font-medium" style={{ color: "#9BA39E" }}>
              QuoteMate Pro
            </div>
            <div className="text-[15px] font-semibold text-white mt-[2px]">
              Cancel anytime · No contracts
            </div>
          </div>
          <div className="text-right">
            <div className="text-[28px] font-bold text-white tracking-[-0.5px] leading-none">
              $19
            </div>
            <div className="text-[13px] font-medium" style={{ color: "#9BA39E" }}>
              / month
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="w-full text-[13px] font-medium text-center rounded-[12px] py-[10px] px-3"
            style={{
              background: "var(--color-qm-danger-soft)",
              color: "var(--color-qm-danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        {isPastDue ? (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="w-full h-14 rounded-[16px] flex items-center justify-center gap-2 text-[17px] font-semibold text-white"
            style={{
              background: "var(--color-qm-accent)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Opening billing…" : "Update payment method"}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-14 rounded-[16px] flex items-center justify-center gap-2 text-[17px] font-semibold text-white"
            style={{
              background: "var(--color-qm-accent)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <Zap size={18} strokeWidth={2.3} />
            {loading ? "Opening checkout…" : "Start free trial — no charge for 14 days"}
          </button>
        )}

        <p className="text-[12px] text-qm-text-faint text-center">
          Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}
