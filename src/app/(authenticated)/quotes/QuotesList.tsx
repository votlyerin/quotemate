"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronRight, Lock } from "lucide-react";
import type { Quote } from "@/types/database";
import { ProUpgradePrompt } from "@/components/ProUpgradePrompt";
import { effectiveStatus } from "@/lib/quote-status";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MARGIN_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  risky: "Risky",
  underpriced: "Underpriced",
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  draft: {
    background: "var(--color-qm-surface-alt)",
    color: "var(--color-qm-text-muted)",
    border: "1px solid var(--color-qm-border)",
  },
  sent: { background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE" },
  accepted: {
    background: "var(--color-qm-accent-soft)",
    color: "var(--color-qm-accent-dark)",
    border: "1px solid rgba(16,185,129,0.2)",
  },
  declined: {
    background: "var(--color-qm-danger-soft)",
    color: "var(--color-qm-danger)",
    border: "1px solid rgba(224,86,61,0.2)",
  },
  expired: {
    background: "var(--color-qm-surface-alt)",
    color: "var(--color-qm-text-faint)",
    border: "1px solid var(--color-qm-border)",
  },
};

const MARGIN_STYLE: Record<string, React.CSSProperties> = {
  excellent: {
    background: "var(--color-qm-excellent-soft)",
    color: "var(--color-qm-excellent)",
    border: "1px solid rgba(11,143,102,0.2)",
  },
  good: {
    background: "var(--color-qm-good-soft)",
    color: "var(--color-qm-good)",
    border: "1px solid rgba(16,185,129,0.2)",
  },
  risky: {
    background: "var(--color-qm-warn-soft)",
    color: "var(--color-qm-warn)",
    border: "1px solid rgba(232,163,58,0.2)",
  },
  underpriced: {
    background: "var(--color-qm-danger-soft)",
    color: "var(--color-qm-danger)",
    border: "1px solid rgba(224,86,61,0.2)",
  },
};

const STATUS_FILTERS = ["All", "Draft", "Sent", "Accepted", "Declined", "Expired"];

function SmBadge({
  label,
  style,
}: {
  label: string;
  style: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center h-5 px-2 rounded-[6px] text-[11px] font-semibold capitalize"
      style={style}
    >
      {label}
    </span>
  );
}

export function QuotesList({
  quotes,
  total,
  tier = "free",
  freeHistoryLimit = 5,
  hasUsedTrial = false,
}: {
  quotes: Quote[];
  total: number;
  tier?: "free" | "pro";
  freeHistoryLimit?: number;
  hasUsedTrial?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPro = tier === "pro";
  const hiddenCount = !isPro && total > freeHistoryLimit ? total - freeHistoryLimit : 0;

  const filtered = quotes.filter((q) => {
    const status = effectiveStatus(q);
    if (filter !== "all" && status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (
        !(q.customer_name || "").toLowerCase().includes(s) &&
        !(q.customer_address || "").toLowerCase().includes(s)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
      {/* Header */}
      <div className="pt-[56px] px-[22px] pb-4 flex items-center gap-[10px]">
        <div className="flex-1">
          <div className="text-[12px] text-qm-text-muted font-medium">
            {isPro ? `${total} total` : `${Math.min(total, freeHistoryLimit)} shown`}
          </div>
          <div className="text-[26px] font-bold text-qm-text tracking-[-0.6px]">
            Quotes
          </div>
        </div>
        <button
          onClick={() => router.push("/new-quote")}
          className="h-10 px-[14px] rounded-[12px] bg-qm-accent text-white flex items-center gap-[6px] text-[14px] font-semibold shrink-0"
        >
          <Plus size={18} strokeWidth={2.2} />
          New
        </button>
      </div>

      {/* Search */}
      <div className="px-[22px] pb-3">
        <div className="flex items-center gap-[10px] bg-qm-surface border border-qm-border rounded-[14px] px-[14px] h-11">
          <Search size={18} className="text-qm-text-muted shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or address"
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-qm-text placeholder:text-qm-text-faint"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-[22px] pb-1 flex gap-[6px] overflow-x-auto">
        {STATUS_FILTERS.map((f) => {
          const id = f.toLowerCase();
          const active = filter === id;
          return (
            <button
              key={f}
              onClick={() => setFilter(id)}
              className={`h-8 px-[14px] rounded-full shrink-0 text-[13px] font-semibold transition-colors ${
                active
                  ? "bg-qm-text text-qm-bg border border-qm-text"
                  : "bg-qm-surface text-qm-text-muted border border-qm-border"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-[14px] pb-6">
        <div className="flex flex-col gap-[10px]">
          {filtered.map((q) => (
            <button
              key={q.id}
              onClick={() => router.push(`/quotes/${q.id}`)}
              className="w-full text-left"
            >
              <div className="bg-qm-surface border border-qm-border rounded-2xl p-[14px] flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-qm-text tracking-[-0.2px] truncate">
                    {q.customer_name || "Unknown customer"}
                  </div>
                  <div className="text-[12px] text-qm-text-muted mt-[2px] truncate">
                    {q.customer_address || "—"} ·{" "}
                    {formatDate(q.created_at)}
                  </div>
                  <div className="mt-2 flex items-center gap-[6px] flex-wrap">
                    {(() => {
                      const s = effectiveStatus(q);
                      return <SmBadge label={s} style={STATUS_STYLE[s] || {}} />;
                    })()}
                    {q.margin_status && (
                      <SmBadge
                        label={`${MARGIN_LABEL[q.margin_status] ?? q.margin_status}${q.margin_pct != null ? ` · ${q.margin_pct}%` : ""}`}
                        style={MARGIN_STYLE[q.margin_status] || {}}
                      />
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[18px] font-bold text-qm-text tracking-[-0.4px]">
                    ${q.final_price ?? q.recommended_price ?? "—"}
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-qm-text-faint ml-auto mt-[2px]"
                  />
                </div>
              </div>
            </button>
          ))}

          {/* Free tier history limit banner */}
          {!isPro && hiddenCount > 0 && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="w-full border border-dashed border-qm-border-strong rounded-2xl p-[14px] flex items-center gap-3 text-left"
              style={{ background: "var(--color-qm-surface-alt)" }}
            >
              <div
                className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: "var(--color-qm-accent-soft)" }}
              >
                <Lock
                  size={18}
                  style={{ color: "var(--color-qm-accent)" }}
                />
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-qm-text">
                  {hiddenCount} older quote{hiddenCount !== 1 ? "s" : ""} hidden
                </div>
                <div className="text-[12px] text-qm-text-muted mt-[2px]">
                  Upgrade to Pro to see your full history
                </div>
              </div>
              <ChevronRight size={16} className="text-qm-text-muted" />
            </button>
          )}

          {filtered.length === 0 && (
            <div className="py-10 text-center text-[14px] text-qm-text-muted">
              {quotes.length === 0
                ? "No quotes yet. Tap + New to create your first one."
                : "No quotes match this filter."}
            </div>
          )}
        </div>
      </div>

      {/* Upgrade prompt */}
      {showUpgrade && (
        <ProUpgradePrompt
          title="Unlock your full quote history"
          body="Free accounts show only the 5 most recent quotes. Upgrade to Pro for unlimited history and much more. $19/month — cancel any time."
          hasUsedTrial={hasUsedTrial}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
