"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Copy,
  Send,
  Check,
  Pencil,
  Zap,
  MessageSquare,
  Mail,
  X,
} from "lucide-react";
import posthog from "posthog-js";
import type { Quote, Profile } from "@/types/database";
import { ProUpgradePrompt } from "@/components/ProUpgradePrompt";
import { effectiveStatus } from "@/lib/quote-status";

// Set to true when Twilio A2P registration is complete
const SMS_ENABLED = false;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_OPTS = ["draft", "sent", "accepted", "declined", "expired"] as const;

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
  },
  good: {
    background: "var(--color-qm-good-soft)",
    color: "var(--color-qm-good)",
  },
  risky: {
    background: "var(--color-qm-warn-soft)",
    color: "var(--color-qm-warn)",
  },
  underpriced: {
    background: "var(--color-qm-danger-soft)",
    color: "var(--color-qm-danger)",
  },
};

const MARGIN_LABEL: Record<string, string> = {
  excellent: "Excellent",
  good: "Good",
  risky: "Risky",
  underpriced: "Underpriced",
};

function Badge({
  label,
  style,
  size = "sm",
}: {
  label: string;
  style: React.CSSProperties;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[8px] font-semibold capitalize ${
        size === "md"
          ? "h-7 px-[12px] text-[13px]"
          : "h-5 px-[8px] text-[11px]"
      }`}
      style={style}
    >
      {label}
    </span>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-start py-[10px] border-b border-qm-border last:border-0 gap-4">
      <span className="text-[13px] text-qm-text-muted shrink-0">{label}</span>
      <span
        className={`text-[14px] font-medium text-right leading-snug tracking-[-0.2px] ${
          accent ? "font-bold text-qm-accent" : "text-qm-text"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] text-qm-text-muted font-semibold uppercase tracking-[0.4px] px-1 pb-[6px] pt-[14px]">
      {children}
    </div>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 h-11 rounded-[14px] bg-qm-surface border border-qm-border text-[14px] font-semibold text-qm-text disabled:opacity-50 transition-opacity"
    >
      {icon}
      {label}
    </button>
  );
}

function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-[qmFadeIn_0.18s_ease-out]">
      <button
        onClick={onClose}
        className="flex-1 bg-black/35 border-none"
        aria-label="Close"
      />
      <div className="bg-qm-bg rounded-t-[20px] px-[22px] pt-[14px] pb-[32px] max-h-[78%] overflow-y-auto animate-[qmSlideUp_0.22s_ease-out]">
        <div className="w-10 h-1 rounded-full bg-qm-border-strong mx-auto mb-[14px]" />
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="text-[18px] font-bold text-qm-text tracking-tight">
            {title}
          </div>
          <button onClick={onClose} className="p-1 -mr-1 shrink-0">
            <X size={18} className="text-qm-text-muted" />
          </button>
        </div>
        {subtitle && (
          <div className="text-[13px] text-qm-text-muted mt-[4px] leading-relaxed">
            {subtitle}
          </div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function QuoteDetail({
  quote,
  profile,
  userId,
  tier = "free",
}: {
  quote: Quote;
  profile: Profile | null;
  userId: string;
  tier?: "free" | "pro";
}) {
  const router = useRouter();
  const [status, setStatus] = useState(quote.status);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmDup, setConfirmDup] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [smsSheet, setSmsSheet] = useState(false);
  const [emailSheet, setEmailSheet] = useState(false);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isPro = tier === "pro";
  // Use effectiveStatus for display — overrides draft/sent to expired when past expiry date
  const displayStatus = effectiveStatus({ status, expires_at: quote.expires_at });

  async function updateStatus(newStatus: Quote["status"]) {
    setStatus(newStatus);
    setStatusOpen(false);
    setUpdating(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("quotes")
        .update({ status: newStatus })
        .eq("id", quote.id);
    } finally {
      setUpdating(false);
    }
  }

  async function duplicateQuote() {
    setDuplicating(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const expiryDays = profile?.quote_expiry_days ?? 7;
      const { data } = await supabase
        .from("quotes")
        .insert({
          user_id: userId,
          customer_name: quote.customer_name,
          customer_phone: quote.customer_phone,
          customer_email: quote.customer_email,
          customer_address: quote.customer_address,
          source: quote.source,
          load_size: quote.load_size,
          job_type: quote.job_type,
          complexity_factors: quote.complexity_factors,
          labor_hours: quote.labor_hours,
          crew_size: quote.crew_size,
          dump_fee: quote.dump_fee,
          travel_fee: quote.travel_fee,
          addons: quote.addons,
          discount: quote.discount,
          notes: quote.notes,
          recommended_price: quote.recommended_price,
          final_price: quote.final_price,
          total_cost: quote.total_cost,
          profit: quote.profit,
          margin_pct: quote.margin_pct,
          margin_status: quote.margin_status,
          status: "draft",
          expires_at: new Date(
            Date.now() + expiryDays * 86400000
          ).toISOString(),
        })
        .select("id")
        .single();

      if (data?.id) {
        router.push(`/quotes/${data.id}`);
      } else {
        router.push("/quotes");
      }
    } finally {
      setDuplicating(false);
      setConfirmDup(false);
    }
  }

  async function handleSendSms() {
    if (!isPro) { setSmsSheet(false); setShowUpgrade(true); return; }
    setSmsSending(true);
    setSmsError(null);
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Send failed");
      setSmsSent(true);
      setStatus("sent");
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSmsSending(false);
    }
  }

  async function handleSendEmail() {
    if (!isPro) { setEmailSheet(false); setShowUpgrade(true); return; }
    setEmailSending(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: quote.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Send failed");
      posthog.capture("quote_sent", { method: "email", final_price: quote.final_price });
      setEmailSent(true);
      setStatus("sent");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  }

  const marginLabel = quote.margin_status
    ? `${MARGIN_LABEL[quote.margin_status] ?? quote.margin_status}${quote.margin_pct != null ? ` · ${quote.margin_pct}%` : ""}`
    : null;

  const LOAD_LABELS: Record<string, string> = {
    min: "Minimum pickup", eight: "1/8 truck", qtr: "1/4 truck",
    half: "1/2 truck", three: "3/4 truck", full: "Full truck", multiple: "Multiple trucks",
  };
  const loadLabel = (quote.load_size && LOAD_LABELS[quote.load_size]) ?? quote.load_size ?? "—";

  // Send preview helpers
  const businessName = profile?.business_name || "Your Business";
  const ownerName = (profile?.owner_name || "You").split(" ")[0];
  const customerFirst = (quote.customer_name || "there").split(" ")[0];
  const finalPrice = quote.final_price ?? quote.recommended_price ?? 0;
  const expiryDays = profile?.quote_expiry_days ?? 7;
  const smsPreview = `Hi ${customerFirst}, ${ownerName} from ${businessName} here. Your quote for the ${loadLabel.toLowerCase()} is $${finalPrice}. Includes loading, hauling, and disposal — valid ${expiryDays} days. Call or text us back to confirm.`;
  const isDraft = displayStatus === "draft";

  return (
    <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-[22px] py-3 shrink-0">
        <button
          onClick={() => router.push("/quotes")}
          className="p-2 -ml-2 rounded-full active:bg-qm-border"
        >
          <ArrowLeft size={20} className="text-qm-text" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-qm-text">
            Quote details
          </div>
          {quote.quote_number && (
            <div className="text-[11px] text-qm-text-muted">
              #{quote.quote_number}
            </div>
          )}
        </div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: updating
              ? "var(--color-qm-warn)"
              : "transparent",
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-[22px] pt-1 pb-6">
        {/* Hero card */}
        <div className="bg-qm-surface border border-qm-border rounded-[18px] p-[20px]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-qm-text-muted font-medium">
                {quote.customer_name || "Unknown customer"}
              </div>
              <div className="mt-1 text-[36px] font-bold text-qm-text tracking-[-1px] leading-none">
                ${quote.final_price ?? quote.recommended_price ?? "—"}
              </div>
              <div className="mt-[10px] flex gap-[6px] flex-wrap">
                <Badge
                  label={displayStatus}
                  style={STATUS_STYLE[displayStatus] || {}}
                  size="md"
                />
                {quote.margin_status && marginLabel && (
                  <Badge
                    label={marginLabel}
                    style={MARGIN_STYLE[quote.margin_status] || {}}
                    size="md"
                  />
                )}
              </div>
            </div>
            <button
              onClick={() =>
                isPro ? setStatusOpen(!statusOpen) : setShowUpgrade(true)
              }
              className="flex items-center gap-1 px-[10px] py-[6px] rounded-[10px] bg-qm-surface-alt border border-qm-border text-[12px] font-semibold text-qm-text shrink-0"
            >
              {isPro ? (
                <>Set status <ChevronDown size={14} /></>
              ) : (
                <>Status <Zap size={12} style={{ color: "var(--color-qm-accent)" }} /></>
              )}
            </button>
          </div>

          {isPro && statusOpen && (
            <div className="mt-3 flex flex-wrap gap-[6px]">
              {STATUS_OPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`h-[30px] px-3 rounded-lg text-[12px] font-semibold capitalize transition-colors ${
                    status === s
                      ? "bg-qm-accent text-white border border-qm-accent"
                      : "bg-qm-surface-alt text-qm-text border border-qm-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Customer section */}
        <SectionLabel>Customer</SectionLabel>
        <div className="bg-qm-surface border border-qm-border rounded-[18px] px-[14px]">
          {quote.customer_phone && (
            <Row label="Phone" value={quote.customer_phone} />
          )}
          {quote.customer_email && (
            <Row label="Email" value={quote.customer_email} />
          )}
          {quote.customer_address && (
            <Row label="Address" value={quote.customer_address} />
          )}
          {quote.source && <Row label="Source" value={quote.source} />}
          {!quote.customer_phone &&
            !quote.customer_email &&
            !quote.customer_address && (
              <div className="py-3 text-[13px] text-qm-text-muted text-center">
                No customer details saved
              </div>
            )}
        </div>

        {/* Job section */}
        <SectionLabel>Job</SectionLabel>
        <div className="bg-qm-surface border border-qm-border rounded-[18px] px-[14px]">
          {quote.load_size && <Row label="Load size" value={loadLabel} />}
          {quote.job_type && <Row label="Job type" value={quote.job_type} />}
          {(quote.crew_size || quote.labor_hours) && (
            <Row
              label="Crew"
              value={`${quote.crew_size ?? "—"} ${quote.crew_size === 1 ? "person" : "people"} · ${quote.labor_hours ?? "—"} hrs`}
            />
          )}
          {quote.complexity_factors?.length > 0 && (
            <Row
              label="Complexity"
              value={quote.complexity_factors.join(", ")}
            />
          )}
          {quote.dump_fee > 0 && (
            <Row label="Dump fee" value={`$${quote.dump_fee}`} />
          )}
          {quote.travel_fee > 0 && (
            <Row label="Travel / fuel" value={`$${quote.travel_fee}`} />
          )}
          {quote.addons > 0 && (
            <Row label="Add-ons" value={`$${quote.addons}`} />
          )}
          {quote.discount > 0 && (
            <Row label="Discount" value={`−$${quote.discount}`} />
          )}
          {quote.notes && <Row label="Notes" value={quote.notes} />}
        </div>

        {/* Profit breakdown */}
        {(quote.final_price || quote.total_cost) && (
          <>
            <SectionLabel>Profit breakdown</SectionLabel>
            <div className="bg-qm-surface border border-qm-border rounded-[18px] px-[14px]">
              {quote.final_price && (
                <Row
                  label="Quote price"
                  value={`$${quote.final_price}`}
                />
              )}
              {quote.total_cost != null && (
                <Row
                  label="Estimated cost"
                  value={`$${quote.total_cost}`}
                />
              )}
              {quote.profit != null && (
                <Row
                  label="Estimated profit"
                  value={`$${quote.profit}`}
                  accent
                />
              )}
              {quote.margin_pct != null && (
                <Row
                  label="Gross margin"
                  value={
                    <span style={{ color: "var(--color-qm-accent)", fontWeight: 700 }}>
                      {quote.margin_pct}%
                    </span>
                  }
                />
              )}
              {quote.margin_override != null && (
                <Row
                  label="Target margin"
                  value={
                    <span className="text-qm-text-muted">
                      {quote.margin_override}% <span className="text-qm-text-faint text-[12px]">(custom for this quote)</span>
                    </span>
                  }
                />
              )}
              {quote.override_reason && (
                <Row
                  label="Price override reason"
                  value={quote.override_reason}
                />
              )}
              {quote.recommended_price &&
                quote.final_price !== quote.recommended_price && (
                  <Row
                    label="Recommended price"
                    value={`$${quote.recommended_price}`}
                  />
                )}
            </div>
          </>
        )}

        {/* Expires */}
        {quote.expires_at && (
          <div className="mt-3 px-1 text-[12px] text-qm-text-muted">
            Expires:{" "}
            {new Date(quote.expires_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}

        {/* Send to customer — draft only */}
        {isDraft && (quote.customer_phone || quote.customer_email) && (
          <div className="mt-[18px]">
            <div className="text-[12px] text-qm-text-muted font-semibold uppercase tracking-[0.4px] px-1 mb-[10px]">
              Send to customer
            </div>
            <div className="flex flex-col gap-[8px]">
              {SMS_ENABLED && quote.customer_phone && (
                <button
                  onClick={() => isPro ? setSmsSheet(true) : setShowUpgrade(true)}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold text-white transition-opacity active:opacity-80"
                  style={{ background: "var(--color-qm-accent)" }}
                >
                  {isPro ? <MessageSquare size={17} /> : <Zap size={17} strokeWidth={2.3} />}
                  Send SMS to {quote.customer_phone}
                </button>
              )}
              {quote.customer_email && (
                <button
                  onClick={() => isPro ? setEmailSheet(true) : setShowUpgrade(true)}
                  className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold transition-opacity active:opacity-80 bg-qm-surface border border-qm-border text-qm-text"
                >
                  {isPro ? <Mail size={17} /> : <Zap size={17} style={{ color: "var(--color-qm-accent)" }} strokeWidth={2.3} />}
                  Send email to {quote.customer_email}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-[18px] grid grid-cols-2 gap-[10px]">
          {isDraft && (
            <ActionBtn
              onClick={() => router.push(`/quotes/${quote.id}/edit`)}
              icon={<Pencil size={16} />}
              label="Edit quote"
            />
          )}
          <ActionBtn
            onClick={() => router.push("/new-quote")}
            icon={<Pencil size={16} />}
            label="New quote"
          />
          <ActionBtn
            onClick={() => setConfirmDup(true)}
            icon={<Copy size={16} />}
            label="Duplicate"
          />
          <ActionBtn
            onClick={() =>
              isPro ? updateStatus("sent") : setShowUpgrade(true)
            }
            icon={isPro ? <Send size={16} /> : <Zap size={16} style={{ color: "var(--color-qm-accent)" }} />}
            label="Mark sent"
            disabled={updating}
          />
          <ActionBtn
            onClick={() =>
              isPro ? updateStatus("accepted") : setShowUpgrade(true)
            }
            icon={isPro ? <Check size={16} /> : <Zap size={16} style={{ color: "var(--color-qm-accent)" }} />}
            label="Accepted"
            disabled={updating}
          />
        </div>
      </div>

      {/* Pro upgrade prompt */}
      {showUpgrade && (
        <ProUpgradePrompt
          title="Track quote status with Pro"
          body={profile?.has_used_trial
            ? "Upgrade to Pro to mark quotes as Sent, Accepted, or Declined and track your conversion rate."
            : "Upgrade to Pro to mark quotes as Sent, Accepted, or Declined and track your conversion rate. $19/month — cancel any time."}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {/* SMS sheet — hidden until SMS_ENABLED */}
      {SMS_ENABLED && smsSheet && (
        <Sheet
          title="Send via SMS"
          subtitle={`To: ${quote.customer_phone}`}
          onClose={() => { setSmsSheet(false); setSmsError(null); }}
        >
          {smsSent ? (
            <div
              className="rounded-[14px] p-[14px] flex items-center gap-3"
              style={{ background: "var(--color-qm-accent-soft)" }}
            >
              <Check size={20} style={{ color: "var(--color-qm-accent)", flexShrink: 0 }} strokeWidth={2.5} />
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--color-qm-accent-dark)" }}>
                  SMS sent!
                </div>
                <div className="text-[12px] mt-[2px]" style={{ color: "var(--color-qm-accent-dark)", opacity: 0.8 }}>
                  Quote status updated to Sent.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-qm-surface border border-qm-border rounded-[14px] px-[14px] py-[12px] text-[13px] text-qm-text-muted leading-relaxed mb-4">
                {smsPreview}
              </div>
              {smsError && (
                <div
                  className="rounded-[10px] px-[12px] py-[10px] text-[13px] mb-3"
                  style={{ background: "var(--color-qm-danger-soft)", color: "var(--color-qm-danger)" }}
                >
                  {smsError}
                </div>
              )}
              <button
                onClick={handleSendSms}
                disabled={smsSending}
                className="w-full h-[52px] rounded-2xl bg-qm-accent text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageSquare size={16} />
                {smsSending ? "Sending…" : "Send SMS"}
              </button>
            </>
          )}
        </Sheet>
      )}

      {/* Email sheet */}
      {emailSheet && (
        <Sheet
          title="Send via email"
          subtitle={`To: ${quote.customer_email}`}
          onClose={() => { setEmailSheet(false); setEmailError(null); }}
        >
          {emailSent ? (
            <div
              className="rounded-[14px] p-[14px] flex items-center gap-3"
              style={{ background: "var(--color-qm-accent-soft)" }}
            >
              <Check size={20} style={{ color: "var(--color-qm-accent)", flexShrink: 0 }} strokeWidth={2.5} />
              <div>
                <div className="text-[14px] font-semibold" style={{ color: "var(--color-qm-accent-dark)" }}>
                  Email sent!
                </div>
                <div className="text-[12px] mt-[2px]" style={{ color: "var(--color-qm-accent-dark)", opacity: 0.8 }}>
                  Quote status updated to Sent.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-qm-surface border border-qm-border rounded-[14px] px-[14px] py-[12px] text-[13px] text-qm-text-muted leading-relaxed mb-4">
                <div className="font-semibold text-qm-text mb-1">
                  Subject: Your quote from {businessName} — ${finalPrice}
                </div>
                Hi {customerFirst}, here&apos;s your quote for {loadLabel.toLowerCase()} · ${finalPrice} · valid {expiryDays} days. Includes loading, hauling, and all disposal fees.
              </div>
              {emailError && (
                <div
                  className="rounded-[10px] px-[12px] py-[10px] text-[13px] mb-3"
                  style={{ background: "var(--color-qm-danger-soft)", color: "var(--color-qm-danger)" }}
                >
                  {emailError}
                </div>
              )}
              <button
                onClick={handleSendEmail}
                disabled={emailSending}
                className="w-full h-[52px] rounded-2xl bg-qm-accent text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Mail size={16} />
                {emailSending ? "Sending…" : "Send email"}
              </button>
            </>
          )}
        </Sheet>
      )}

      {/* Duplicate confirmation sheet */}
      {confirmDup && (
        <div
          className="absolute inset-0 z-50 flex flex-col"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmDup(false)}
        >
          <div className="flex-1" />
          <div
            className="bg-qm-surface rounded-t-[22px] px-[22px] pt-[14px] pb-[30px] animate-[qmSlideUp_0.22s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full bg-qm-border-strong mx-auto mb-4" />
            <div
              className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-[14px]"
              style={{ background: "var(--color-qm-accent-soft)" }}
            >
              <Copy size={22} style={{ color: "var(--color-qm-accent)" }} />
            </div>
            <div className="text-[20px] font-bold text-qm-text tracking-[-0.4px]">
              Duplicate this quote?
            </div>
            <div className="mt-2 text-[14px] text-qm-text-muted leading-[1.45]">
              We&apos;ll create a new editable draft using{" "}
              <strong className="text-qm-text font-semibold">
                {quote.customer_name || "this quote"}
              </strong>
              &apos;s details as a starting point. The original stays unchanged.
            </div>
            <div className="mt-[18px] flex flex-col gap-2">
              <button
                onClick={duplicateQuote}
                disabled={duplicating}
                className="w-full h-[52px] rounded-2xl bg-qm-accent text-white font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Copy size={16} />
                {duplicating ? "Duplicating…" : "Duplicate quote"}
              </button>
              <button
                onClick={() => setConfirmDup(false)}
                className="w-full h-[48px] rounded-2xl text-[15px] font-medium text-qm-text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
