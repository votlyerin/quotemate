"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import {
  Bell,
  Receipt,
  CheckCircle2,
  DollarSign,
  BarChart3,
  ArrowRight,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Profile, Quote } from "@/types/database";
import { effectiveStatus } from "@/lib/quote-status";
import { getEffectiveSubStatus } from "@/lib/subscription";

const FREE_MONTHLY_LIMIT = 5;

interface DashboardStats {
  month: number;
  accepted: number;
  avgValue: number;
  profit: number;
}

interface DashboardContentProps {
  profile: Profile | null;
  stats: DashboardStats;
  recentQuotes: Quote[];
  tier?: "free" | "pro";
  monthlyQuoteCount?: number;
  checkoutSuccess?: boolean;
}

function StatCard({
  label,
  value,
  hint,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-qm-surface border border-qm-border rounded-[16px] p-3.5 flex flex-col gap-1.5">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
          accent ? "bg-qm-accent-soft" : "bg-qm-surface-alt"
        }`}
      >
        <Icon
          size={15}
          className={accent ? "text-qm-accent" : "text-qm-text-muted"}
        />
      </div>
      <div className="text-[11px] text-qm-text-muted font-medium mt-0.5 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-[22px] font-bold text-qm-text tracking-tight leading-none">
        {value}
      </div>
      {hint && (
        <div
          className={`text-[11px] font-medium ${
            accent ? "text-qm-accent" : "text-qm-text-muted"
          }`}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

function getMarginTone(status: string | null) {
  switch (status) {
    case "excellent": return "excellent" as const;
    case "good":      return "good" as const;
    case "risky":     return "risky" as const;
    case "underpriced": return "underpriced" as const;
    default:          return "neutral" as const;
  }
}

function getStatusTone(status: string) {
  switch (status) {
    case "sent":     return "sent" as const;
    case "accepted": return "accepted" as const;
    case "declined": return "declined" as const;
    case "expired":  return "expired" as const;
    default:         return "draft" as const;
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DashboardContent({
  profile,
  stats,
  recentQuotes,
  tier = "free",
  monthlyQuoteCount = 0,
  checkoutSuccess = false,
}: DashboardContentProps) {
  const [successDismissed, setSuccessDismissed] = useState(false);

  const subStatus = profile ? getEffectiveSubStatus(profile) : "expired";

  // Fire trial_started once when Stripe redirects back after a trial begins
  useEffect(() => {
    if (checkoutSuccess && (subStatus === "trialing" || subStatus === "trial_ending")) {
      posthog.capture("trial_started");
    }
  }, [checkoutSuccess, subStatus]);

  function handleUpgrade() {
    posthog.capture("upgrade_clicked", { source: "dashboard" });
    window.location.href =
      process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!;
  }

  // Auto-dismiss the checkout success banner after 6s
  useEffect(() => {
    if (!checkoutSuccess) return;
    const t = setTimeout(() => setSuccessDismissed(true), 6000);
    return () => clearTimeout(t);
  }, [checkoutSuccess]);

  const firstName = (profile?.owner_name || "there").split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const closeRate =
    stats.month > 0 ? Math.round((stats.accepted / stats.month) * 100) : 0;

  const isPro = tier === "pro";
  const quotasLeft = Math.max(0, FREE_MONTHLY_LIMIT - monthlyQuoteCount);
  const quotaWarning = !isPro && quotasLeft <= 1;
  const quotaExhausted = !isPro && quotasLeft === 0;

  const showSuccessBanner = checkoutSuccess && !successDismissed;

  return (
    <div className="flex flex-col h-full">
      {/* Checkout success banner */}
      {showSuccessBanner && (
        <div
          className="mx-4 mt-4 rounded-[14px] px-[14px] py-[12px] flex items-start gap-3"
          style={{ background: "var(--color-qm-accent-soft)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-[1px]"
            style={{ background: "var(--color-qm-accent)" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[14px] font-semibold"
              style={{ color: "var(--color-qm-accent-dark)" }}
            >
              Welcome to QuoteMate Pro!
            </div>
            <div
              className="text-[12px] mt-[2px] opacity-85 leading-snug"
              style={{ color: "var(--color-qm-accent-dark)" }}
            >
              Unlimited quotes, full cost breakdowns, and all Pro features are
              now unlocked.
            </div>
          </div>
          <button
            onClick={() => setSuccessDismissed(true)}
            className="shrink-0 p-1 -mr-1 rounded-full"
            style={{ color: "var(--color-qm-accent-dark)" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pt-[60px] px-[22px] pb-3.5 flex items-center gap-3">
        <div className="w-[42px] h-[42px] rounded-xl bg-qm-accent text-white flex items-center justify-center text-base font-bold">
          {firstName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-qm-text-muted font-medium">{today}</div>
          <div className="text-xl font-bold text-qm-text tracking-tight">
            Hi, {firstName}
          </div>
        </div>
        <button className="w-[42px] h-[42px] rounded-xl bg-qm-surface border border-qm-border flex items-center justify-center">
          <Bell size={20} className="text-qm-text" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-[22px] pb-4">
        {/* Free tier quota bar */}
        {!isPro && (
          <div
            className="mb-4 rounded-[14px] px-[14px] py-[12px]"
            style={{
              background: quotaWarning
                ? "var(--color-qm-warn-soft)"
                : "var(--color-qm-surface)",
              border: `1px solid ${
                quotaWarning
                  ? "var(--color-qm-warn)"
                  : "var(--color-qm-border)"
              }`,
            }}
          >
            <div className="flex items-center justify-between mb-[8px]">
              <div
                className="text-[12px] font-semibold"
                style={{
                  color: quotaWarning
                    ? "var(--color-qm-warn)"
                    : "var(--color-qm-text-muted)",
                }}
              >
                {quotaExhausted
                  ? "Monthly quote limit reached"
                  : `${monthlyQuoteCount} of ${FREE_MONTHLY_LIMIT} free quotes used`}
              </div>
              <button
                onClick={handleUpgrade}
                className="flex items-center gap-[4px] text-[11px] font-bold uppercase tracking-[0.3px]"
                style={{ color: "var(--color-qm-accent)" }}
              >
                <Zap size={11} strokeWidth={2.5} />
                Upgrade
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-[5px] rounded-full bg-qm-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (monthlyQuoteCount / FREE_MONTHLY_LIMIT) * 100
                  )}%`,
                  background: quotaWarning
                    ? "var(--color-qm-warn)"
                    : "var(--color-qm-accent)",
                }}
              />
            </div>
            {quotaExhausted && (
              <div
                className="text-[11px] mt-[6px]"
                style={{ color: "var(--color-qm-warn)" }}
              >
                Resets next month · Upgrade Pro for unlimited quotes
              </div>
            )}
          </div>
        )}

        {/* Hero CTA */}
        <Link href="/new-quote" className="block">
          <div className="bg-qm-text text-qm-bg rounded-[22px] p-5 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-qm-accent opacity-[0.18]" />
            <div className="absolute right-3.5 bottom-3.5 w-[52px] h-[52px] rounded-[14px] bg-qm-accent flex items-center justify-center">
              <ArrowRight size={24} color="#fff" strokeWidth={2.2} />
            </div>
            <div className="text-xs font-semibold text-qm-accent uppercase tracking-wider">
              Quick start
            </div>
            <div className="mt-1.5 text-[22px] font-bold tracking-tight leading-tight max-w-[200px]">
              New quote in 60 seconds
            </div>
            <div className="mt-1.5 text-[13px] opacity-65 max-w-[220px]">
              Standing in the driveway? Tap to start.
            </div>
          </div>
        </Link>

        {/* Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <StatCard
            label="Quotes this month"
            value={String(stats.month)}
            icon={Receipt}
          />
          <StatCard
            label="Accepted"
            value={String(stats.accepted)}
            hint={stats.month > 0 ? `${closeRate}% close rate` : undefined}
            accent
            icon={CheckCircle2}
          />
          <StatCard
            label="Avg quote value"
            value={`$${stats.avgValue}`}
            icon={DollarSign}
          />
          <StatCard
            label="Profit this month"
            value={`$${stats.profit.toLocaleString()}`}
            accent
            icon={BarChart3}
          />
        </div>

        {/* Recent Quotes */}
        <div className="mt-[26px] flex items-center justify-between mb-2.5">
          <div className="text-base font-bold text-qm-text tracking-tight">
            Recent quotes
          </div>
          <Link
            href="/quotes"
            className="text-[13px] font-semibold text-qm-accent"
          >
            See all
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="bg-qm-surface border border-qm-border rounded-[16px] p-10 text-center">
            <div className="text-qm-text-muted text-sm">
              No quotes yet. Tap the button above to create your first one.
            </div>
          </div>
        ) : (
          <div className="bg-qm-surface border border-qm-border rounded-[16px] overflow-hidden">
            {recentQuotes.map((quote, i) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i > 0 ? "border-t border-qm-border" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-qm-text tracking-tight truncate">
                    {quote.customer_name || "Unnamed"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {(() => {
                      const s = effectiveStatus(quote);
                      return (
                        <Badge tone={getStatusTone(s)} size="sm">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Badge>
                      );
                    })()}
                    {quote.margin_status && (
                      <Badge
                        tone={getMarginTone(quote.margin_status)}
                        size="sm"
                      >
                        {quote.margin_status.charAt(0).toUpperCase() +
                          quote.margin_status.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-qm-text tracking-tight">
                    ${quote.final_price ?? quote.recommended_price ?? 0}
                  </div>
                  <div className="text-[11px] text-qm-text-muted mt-0.5">
                    {formatDate(quote.created_at)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
