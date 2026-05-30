"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  X,
  Zap,
  Sparkles,
} from "lucide-react";

interface Feature {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  highlight?: boolean;
}

interface FeatureGroup {
  title: string;
  features: Feature[];
}

// Set to true when Twilio A2P registration is complete
const SMS_ENABLED = false;

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Quotes",
    features: [
      {
        label: "Quotes per month",
        free: "5 quotes",
        pro: "Unlimited",
        highlight: true,
      },
      {
        label: "Quote history",
        free: "Last 5",
        pro: "Full history",
        highlight: true,
      },
      { label: "Quote calculator", free: true, pro: true },
      { label: "Load size pricing", free: true, pro: true },
      { label: "Copy quote text", free: true, pro: true },
    ],
  },
  {
    title: "Pricing & analysis",
    features: [
      { label: "Margin tracking", free: true, pro: true },
      { label: "Dump fee per ton", free: true, pro: true },
      {
        label: "Line-item cost breakdown",
        free: false,
        pro: true,
        highlight: true,
      },
      {
        label: "Custom complexity surcharges",
        free: false,
        pro: true,
        highlight: true,
      },
    ],
  },
  {
    title: "Sending & status",
    features: [
      ...(SMS_ENABLED ? [{ label: "Send via SMS / text", free: false, pro: true, highlight: true } as Feature] : []),
      { label: "Send via email", free: false, pro: true, highlight: true },
      {
        label: "Status tracking",
        free: false,
        pro: true,
        highlight: true,
      },
    ],
  },
];

function Cell({
  value,
  isProCol,
}: {
  value: boolean | string;
  isProCol: boolean;
}) {
  if (typeof value === "string") {
    return (
      <div
        className={`text-[13px] font-semibold text-center leading-tight ${
          isProCol ? "text-qm-accent" : "text-qm-text-muted"
        }`}
      >
        {value}
      </div>
    );
  }
  if (value) {
    return (
      <div className="flex justify-center">
        <div
          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center ${
            isProCol
              ? "bg-qm-accent"
              : "bg-qm-surface-alt border border-qm-border"
          }`}
        >
          <Check
            size={13}
            strokeWidth={2.5}
            className={isProCol ? "text-white" : "text-qm-text-muted"}
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center bg-qm-surface-alt border border-qm-border">
        <X size={13} strokeWidth={2.5} className="text-qm-text-faint" />
      </div>
    </div>
  );
}

export function UpgradePageContent({
  tier,
  hasUsedTrial = false,
}: {
  tier: "free" | "pro";
  hasUsedTrial?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPro = tier === "pro";

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Couldn't open checkout.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg">
      {/* Header */}
      <div className="pt-[56px] px-[22px] pb-4 shrink-0 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full active:bg-qm-border"
        >
          <ArrowLeft size={20} className="text-qm-text" />
        </button>
        <div className="flex-1">
          <div className="text-[12px] text-qm-text-muted font-medium">
            QuoteMate
          </div>
          <div className="text-[22px] font-bold text-qm-text tracking-[-0.5px]">
            Free vs Pro
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pb-8">

        {/* Plan headers */}
        <div className="grid grid-cols-[1fr_100px_100px] gap-2 mb-3 px-1">
          <div />
          <div className="text-center">
            <div className="text-[12px] font-semibold text-qm-text-muted uppercase tracking-[0.4px]">
              Free
            </div>
            <div className="text-[13px] font-bold text-qm-text mt-[2px]">
              $0
            </div>
          </div>
          <div
            className="rounded-[14px] py-[8px] text-center"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <div
              className="text-[12px] font-semibold uppercase tracking-[0.4px]"
              style={{ color: "var(--color-qm-accent-dark)" }}
            >
              Pro
            </div>
            <div
              className="text-[13px] font-bold mt-[2px]"
              style={{ color: "var(--color-qm-accent-dark)" }}
            >
              $19/mo
            </div>
          </div>
        </div>

        {/* Feature groups */}
        {FEATURE_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.6px] mb-2 px-1">
              {group.title}
            </div>
            <div className="bg-qm-surface border border-qm-border rounded-[18px] overflow-hidden">
              {group.features.map((feature, i) => (
                <div
                  key={feature.label}
                  className={`grid grid-cols-[1fr_100px_100px] gap-2 items-center px-4 py-[11px] ${
                    i > 0 ? "border-t border-qm-border" : ""
                  } ${
                    feature.highlight && !feature.free
                      ? "bg-qm-surface-alt"
                      : ""
                  }`}
                >
                  <div
                    className={`text-[13px] font-medium leading-snug ${
                      feature.highlight && !feature.free
                        ? "text-qm-text"
                        : "text-qm-text-muted"
                    }`}
                  >
                    {feature.label}
                  </div>
                  <Cell value={feature.free} isProCol={false} />
                  <Cell value={feature.pro} isProCol={true} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Trial badge — only for first-time trial eligibles */}
        {!isPro && !hasUsedTrial && (
          <div
            className="rounded-[14px] px-[14px] py-[12px] flex items-center gap-3 mb-5"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--color-qm-accent)" }}
            >
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-semibold"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                14-day free trial included
              </div>
              <div
                className="text-[11.5px] mt-[1px] opacity-85 leading-snug"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                Full Pro access from day one. No charge until day 15 — cancel any time.
              </div>
            </div>
          </div>
        )}

        {/* CTA — free users */}
        {!isPro && (
          <>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-[54px] rounded-[16px] flex items-center justify-center gap-2 text-[16px] font-semibold text-white"
              style={{
                background: "var(--color-qm-accent)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Zap size={17} strokeWidth={2.3} />
              {loading
                ? "Opening checkout…"
                : hasUsedTrial
                ? "Upgrade to Pro — $19/month"
                : "Start free trial — no charge for 14 days"}
            </button>
            {error && (
              <div
                className="mt-3 text-[13px] font-medium text-center rounded-[12px] py-[10px] px-3"
                style={{
                  background: "var(--color-qm-danger-soft)",
                  color: "var(--color-qm-danger)",
                }}
              >
                {error}
              </div>
            )}
            <p className="text-center text-[11.5px] text-qm-text-faint mt-3 leading-relaxed">
              {hasUsedTrial
                ? "Billed immediately · Cancel any time · No contracts"
                : "Billed monthly · Cancel any time · No contracts"}
            </p>
          </>
        )}

        {/* Already Pro state */}
        {isPro && (
          <div
            className="rounded-[16px] px-[16px] py-[16px] flex items-center gap-3"
            style={{
              background: "var(--color-qm-accent-soft)",
              border: "1px solid var(--color-qm-accent)",
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "var(--color-qm-accent)" }}
            >
              <Check size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div
                className="text-[15px] font-bold"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                You&apos;re on QuoteMate Pro
              </div>
              <div
                className="text-[12px] mt-[2px] opacity-85"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                All features are unlocked and active.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
