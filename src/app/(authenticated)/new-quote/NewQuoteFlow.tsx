"use client";

// Set to true when Twilio A2P registration is complete
const SMS_ENABLED = false;

import { useState, useMemo } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck,
  Home,
  ArrowUp,
  ArrowRight,
  Package2,
  Zap,
  Check,
  Sparkles,
  Info,
  ChevronRight,
  RefreshCw,
  Receipt,
  Send,
  Copy,
  MessageSquare,
  Image as ImageIcon,
  Pencil,
  AlertTriangle,
  Lock,
  Link2,
  Mail,
} from "lucide-react";
import {
  calculateQuote,
  getAutoDumpFee,
  DEFAULT_TONS,
  LOAD_LABELS as LOAD_LABEL_MAP,
  type PricingConfig,
  type TruckPricing,
  type QuoteCalcResult,
} from "@/lib/quote-calc";
import type { Profile } from "@/types/database";
import { ProUpgradePrompt } from "@/components/ProUpgradePrompt";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Draft {
  customer: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  loadSize: string;
  jobTypes: string[];
  complexity: string[];
  hours: string;
  crew: string;
  dump: string;
  travel: string;
  addons: string;
  discount: string;
  notes: string;
  photosReviewed: boolean;
  photoNotes: string;
  finalPrice: string;
  overrideReason: string;
  targetMargin: string;
}

type View = "customer" | "job" | "costs" | "result" | "preview";

// ─── Shared UI Components ────────────────────────────────────────────────────

function TopBar({
  title,
  subtitle,
  onBack,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-[22px] py-3 shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full active:bg-qm-border"
        >
          <ArrowLeft size={20} className="text-qm-text" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-qm-text truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-[11px] text-qm-text-muted">{subtitle}</div>
        )}
      </div>
      {trailing}
    </div>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-[5px] px-[22px] pb-2 shrink-0">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-[4px] rounded-full transition-all duration-200 ${
            i === current
              ? "w-6 bg-qm-accent"
              : i < current
              ? "w-2 bg-qm-accent/40"
              : "w-2 bg-qm-border-strong"
          }`}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  prefix,
  suffix,
  optional,
  multiline,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  optional?: boolean;
  multiline?: boolean;
  rows?: number;
}) {
  const base =
    "w-full bg-qm-surface border border-qm-border rounded-xl px-3 py-[11px] text-[14px] text-qm-text placeholder:text-qm-text-faint outline-none focus:border-qm-accent transition-colors";

  return (
    <div>
      <div className="text-[13px] font-medium text-qm-text-muted mb-[7px]">
        {label}
        {optional && (
          <span className="text-qm-text-faint ml-1 font-normal">
            · optional
          </span>
        )}
      </div>
      {prefix || suffix ? (
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-qm-text-muted pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            type={type}
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`${base} ${prefix ? "pl-7" : ""} ${
              suffix ? "pr-16" : ""
            }`}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-qm-text-faint pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={type}
          inputMode={
            type === "tel" ? "tel" : type === "email" ? "email" : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
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
        <div className="text-[18px] font-bold text-qm-text tracking-tight">
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] text-qm-text-muted mt-[6px] leading-relaxed">
            {subtitle}
          </div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function StepShell({
  step,
  title,
  subtitle,
  onBack,
  footer,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <TopBar title={`New quote · Step ${step + 1}/4`} onBack={onBack} />
      <StepDots current={step} total={4} />
      <div className="flex-1 overflow-y-auto px-[22px] pt-5 pb-6">
        <h1 className="text-[24px] font-bold text-qm-text tracking-[-0.6px] leading-[1.15]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[6px] text-[13px] text-qm-text-muted leading-[1.45]">
            {subtitle}
          </p>
        )}
        <div className="mt-[22px] flex flex-col gap-[14px]">{children}</div>
      </div>
      <div className="shrink-0 px-[22px] pt-2 pb-[30px] bg-qm-bg border-t border-qm-border">
        {footer}
      </div>
    </>
  );
}

function MarginGauge({
  marginPct,
  target,
  status,
}: {
  marginPct: number;
  target: number;
  status: QuoteCalcResult["status"];
}) {
  const pos = Math.max(0, Math.min(100, (marginPct / 60) * 100));
  const targetPos = Math.max(0, Math.min(100, (target / 60) * 100));
  const toneColor = {
    Excellent: "var(--color-qm-excellent)",
    Good: "var(--color-qm-good)",
    Risky: "var(--color-qm-warn)",
    Underpriced: "var(--color-qm-danger)",
  }[status];

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-[11px] text-qm-text-muted font-semibold uppercase tracking-[0.4px]">
          Margin status
        </div>
        <div className="text-[13px] text-qm-text-muted">Target {target}%</div>
      </div>
      <div
        className="relative h-[14px] rounded-lg overflow-visible"
        style={{
          background: `linear-gradient(90deg, var(--color-qm-danger) 0%, var(--color-qm-danger) 25%, var(--color-qm-warn) 35%, var(--color-qm-warn) 55%, var(--color-qm-good) 65%, var(--color-qm-excellent) 100%)`,
        }}
      >
        <div
          className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-qm-text rounded-[1px]"
          style={{ left: `${targetPos}%`, transform: "translateX(-1px)" }}
        />
        <div
          className="absolute top-1/2 w-[22px] h-[22px] rounded-full bg-white"
          style={{
            left: `${pos}%`,
            transform: "translate(-50%, -50%)",
            border: `3px solid ${toneColor}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          }}
        />
      </div>
      <div className="flex justify-between mt-2 text-[10.5px] font-semibold text-qm-text-faint uppercase tracking-[0.3px]">
        <span>Underpriced</span>
        <span>Risky</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

function Btn({
  onClick,
  disabled,
  children,
  variant = "primary",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-[52px] rounded-2xl font-semibold text-[15px] transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 ${
        variant === "primary"
          ? "bg-qm-accent text-white"
          : "bg-qm-surface border border-qm-border text-qm-text"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOAD_SIZES = [
  { id: "min",      label: "Minimum",  sub: "pickup",  tons: 0.1  },
  { id: "eight",    label: "1/8",      sub: "truck",   tons: 0.25 },
  { id: "qtr",      label: "1/4",      sub: "truck",   tons: 0.5  },
  { id: "half",     label: "1/2",      sub: "truck",   tons: 1.0  },
  { id: "three",    label: "3/4",      sub: "truck",   tons: 1.5  },
  { id: "full",     label: "Full",     sub: "truck",   tons: 2.0  },
  { id: "multiple", label: "Multiple", sub: "trucks",  tons: 4.0  },
];

const JOB_TYPES = [
  "Household junk",
  "Furniture",
  "Mattress",
  "Appliance",
  "Yard waste",
  "Construction debris",
  "Garage cleanout",
  "Estate cleanout",
  "Other",
];

const COMPLEXITIES = [
  {
    id: "stairs",
    label: "Stairs",
    icon: <ArrowUp size={18} className="text-qm-text-muted shrink-0" />,
  },
  {
    id: "basement",
    label: "Basement",
    icon: <Home size={18} className="text-qm-text-muted shrink-0" />,
  },
  {
    id: "longCarry",
    label: "Long carry",
    icon: <ArrowRight size={18} className="text-qm-text-muted shrink-0" />,
  },
  {
    id: "heavy",
    label: "Heavy / bulky",
    icon: <Package2 size={18} className="text-qm-text-muted shrink-0" />,
  },
  {
    id: "rush",
    label: "Same-day rush",
    icon: <Zap size={18} className="text-qm-text-muted shrink-0" />,
  },
];

const SOURCES = [
  "In-person estimate",
  "Phone call",
  "Text/photos",
  "Website lead",
  "Repeat customer",
  "Other",
];

const OVERRIDE_REASONS = [
  "Customer discount",
  "Competitive price match",
  "Repeat customer",
  "Job complexity changed",
  "Manual correction",
  "Other",
];

const TONE_COLOR: Record<string, string> = {
  Excellent: "var(--color-qm-excellent)",
  Good: "var(--color-qm-good)",
  Risky: "var(--color-qm-warn)",
  Underpriced: "var(--color-qm-danger)",
};

const TONE_SOFT: Record<string, string> = {
  Excellent: "var(--color-qm-excellent-soft)",
  Good: "var(--color-qm-good-soft)",
  Risky: "var(--color-qm-warn-soft)",
  Underpriced: "var(--color-qm-danger-soft)",
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function NewQuoteFlow({
  pricing,
  truck,
  userId,
  profile,
  tier = "free",
  monthlyQuoteCount = 0,
}: {
  pricing: PricingConfig;
  truck: TruckPricing;
  userId: string | null;
  profile: Profile | null;
  tier?: "free" | "pro";
  monthlyQuoteCount?: number;
}) {
  const router = useRouter();
  const [view, setView] = useState<View>("customer");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [dumpIsAuto, setDumpIsAuto] = useState(true);
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [reasonSheet, setReasonSheet] = useState(false);
  const [warnSheet, setWarnSheet] = useState<"save" | "preview" | false>(false);
  const [shareSheet, setShareSheet] = useState(false);
  const [smsSheet, setSmsSheet] = useState(false);
  const [emailSheet, setEmailSheet] = useState(false);
  const [sendUpgradeOpen, setSendUpgradeOpen] = useState(false);
  const [upgradePrompt, setUpgradePrompt] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const isPro = tier === "pro";
  const isQuoteLimitHit = !isPro && monthlyQuoteCount >= 5;

  const [draft, setDraft] = useState<Draft>({
    customer: "",
    phone: "",
    email: "",
    address: "",
    source: "",
    loadSize: "half",
    jobTypes: [],
    complexity: [],
    hours: "",
    crew: String(pricing.crew),
    dump: (() => { const v = getAutoDumpFee("half", pricing); return v > 0 ? String(v) : ""; })(),
    travel: String(pricing.travel),
    addons: "",
    discount: "",
    notes: "",
    photosReviewed: false,
    photoNotes: "",
    finalPrice: "",
    overrideReason: "",
    targetMargin: String(pricing.margin),
  });

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  const calc = useMemo(
    () => calculateQuote(draft, pricing, truck),
    [draft, pricing, truck]
  );

  const finalPrice =
    draft.finalPrice !== ""
      ? parseFloat(draft.finalPrice) || calc.recommended
      : calc.recommended;

  const isOverridden =
    draft.finalPrice !== "" &&
    parseFloat(draft.finalPrice) !== calc.recommended;

  const accentColor = TONE_COLOR[calc.status];

  // Preview text helpers
  const businessName = profile?.business_name || "Your Business";
  const ownerName = (profile?.owner_name || "You").split(" ")[0];
  const customerFirst = (draft.customer || "there").split(" ")[0];
  const expiryDays = profile?.quote_expiry_days ?? 7;
  const expDate = new Date(Date.now() + expiryDays * 86400000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const jobTypeLabel =
    draft.jobTypes.length > 0 ? draft.jobTypes.join(" + ") : "job";

  const smsBody = `Hi ${customerFirst}, ${ownerName} from ${businessName} here. Your quote for the ${jobTypeLabel.toLowerCase()} (${calc.loadLabel}) is $${finalPrice}. Includes loading, hauling, and disposal — valid ${expiryDays} days. Call or text us back to confirm.`;

  const emailBody = `Hi ${customerFirst},\n\nThanks for reaching out. Here's the quote for your ${jobTypeLabel.toLowerCase()}:\n\n• Load size: ${calc.loadLabel}\n• Crew: ${
    calc.crew
  } people, ~${calc.hours} hours\n• Total: $${finalPrice}\n• Valid until: ${fmt(
    expDate
  )}\n\nThis includes loading, hauling, and all disposal fees.\n\nReply to book!\n\n— ${ownerName}\n${businessName}`;

  async function saveQuote(
    status: "draft" | "sent",
    noNav = false
  ): Promise<string | null> {
    if (!userId) {
      router.push("/quotes");
      return null;
    }
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("quotes")
        .insert({
          user_id: userId,
          customer_name: draft.customer || null,
          customer_phone: draft.phone || null,
          customer_email: draft.email || null,
          customer_address: draft.address || null,
          source: draft.source || null,
          load_size: draft.loadSize || null,
          job_type: draft.jobTypes.length > 0 ? draft.jobTypes.join(", ") : null,
          complexity_factors: draft.complexity,
          labor_hours: parseFloat(draft.hours) || null,
          crew_size: parseFloat(draft.crew) || null,
          dump_fee: parseFloat(draft.dump) || 0,
          travel_fee: parseFloat(draft.travel) || 0,
          addons: parseFloat(draft.addons) || 0,
          discount: parseFloat(draft.discount) || 0,
          notes: draft.notes || null,
          photos_reviewed: draft.photosReviewed,
          recommended_price: calc.recommended,
          final_price: finalPrice,
          total_cost: calc.cost,
          profit: calc.profit,
          margin_pct: calc.marginPct,
          margin_status: calc.status.toLowerCase(),
          status,
          override_reason: draft.overrideReason || null,
          margin_override: (() => {
            const v = parseFloat(draft.targetMargin);
            return Number.isFinite(v) && v !== pricing.margin ? v : null;
          })(),
          expires_at: new Date(
            Date.now() + expiryDays * 86400000
          ).toISOString(),
        })
        .select("id")
        .single();
      if (data?.id) {
        posthog.capture("quote_created", {
          load_size: draft.loadSize,
          final_price: finalPrice,
          status,
          is_pro: isPro,
        });
        if (status === "sent") {
          posthog.capture("quote_sent", { method: "manual", final_price: finalPrice });
        }
      }
      return data?.id ?? null;
    } finally {
      setSaving(false);
      if (!noNav) router.push("/quotes");
    }
  }

  // Save with quota-limit check: saves the quote, then shows upgrade prompt
  // for free users who just used their 5th quote this month.
  async function doSave(status: "draft" | "sent") {
    const hitLimit = isQuoteLimitHit || (!isPro && monthlyQuoteCount === 4);
    await saveQuote(status, hitLimit);
    if (hitLimit) {
      setUpgradePrompt({
        title: "You've used your 5 free quotes",
        body: "You've reached the limit for this month. Upgrade to Pro for unlimited quotes, full cost breakdowns, email sending, and more. $19/month — cancel any time.",
      });
    }
  }

  async function handleSendSms() {
    if (isQuoteLimitHit) {
      setSmsSheet(false);
      setUpgradePrompt({
        title: "You've used your 5 free quotes",
        body: "Upgrade to Pro for unlimited quotes and SMS sending. $19/month — cancel any time.",
      });
      return;
    }
    setSmsSending(true);
    setSmsError(null);
    try {
      const quoteId = await saveQuote("draft", true);
      if (!quoteId) throw new Error("Failed to save quote");
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Send failed");
      posthog.capture("quote_sent", { method: "sms", final_price: finalPrice });
      setSmsSent(true);
      setTimeout(() => router.push("/quotes"), 2200);
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSmsSending(false);
    }
  }

  async function handleSendEmail() {
    if (isQuoteLimitHit) {
      setEmailSheet(false);
      setUpgradePrompt({
        title: "You've used your 5 free quotes",
        body: "Upgrade to Pro for unlimited quotes and email sending. $19/month — cancel any time.",
      });
      return;
    }
    setEmailSending(true);
    setEmailError(null);
    try {
      const quoteId = await saveQuote("draft", true);
      if (!quoteId) throw new Error("Failed to save quote");
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Send failed");
      posthog.capture("quote_sent", { method: "email", final_price: finalPrice });
      setEmailSent(true);
      setTimeout(() => router.push("/quotes"), 2200);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailSending(false);
    }
  }

  function handleSaveAction(action: "save" | "preview") {
    if (calc.status === "Underpriced" && !draft.overrideReason) {
      setWarnSheet(action);
      return;
    }
    if (action === "preview") setView("preview");
    else doSave("draft");
  }

  async function handleCopyLink() {
    setShareSheet(false);
    const id = await saveQuote("draft", true);
    if (id) {
      copy(`${window.location.origin}/quotes/${id}`);
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // ── STEP 1: Customer ─────────────────────────────────────────────────────

  if (view === "customer") {
    return (
      <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
        <StepShell
          step={0}
          title="Who's this quote for?"
          subtitle="The basics — we'll save this customer for next time."
          onBack={() => router.push("/dashboard")}
          footer={
            <Btn onClick={() => setView("job")}>Next: Job details</Btn>
          }
        >
          <Field
            label="Customer name"
            value={draft.customer}
            onChange={(v) => set("customer", v)}
            placeholder="Sarah Johnson"
          />
          <Field
            label="Phone"
            type="tel"
            value={draft.phone}
            onChange={(v) => set("phone", v)}
            placeholder="(555) 218-7740"
          />
          <Field
            label="Email"
            type="email"
            optional
            value={draft.email}
            onChange={(v) => set("email", v)}
            placeholder="sarah@example.com"
          />
          <Field
            label="Job address"
            value={draft.address}
            onChange={(v) => set("address", v)}
            placeholder="142 Lakeview Dr, Austin TX"
          />
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[9px]">
              Quote source
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {SOURCES.map((s) => {
                const active = draft.source === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("source", s)}
                    className={`h-[34px] px-3 rounded-[10px] text-[12.5px] font-semibold transition-colors ${
                      active
                        ? "bg-qm-text text-qm-bg border border-qm-text"
                        : "bg-qm-surface text-qm-text border border-qm-border"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </StepShell>
      </div>
    );
  }

  // ── STEP 2: Job ──────────────────────────────────────────────────────────

  if (view === "job") {
    return (
      <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
        <StepShell
          step={1}
          title="Job details"
          subtitle="Pick the load size, what's being hauled, and any tricky stuff."
          onBack={() => setView("customer")}
          footer={<Btn onClick={() => setView("costs")}>Next: Costs</Btn>}
        >
          {/* Load size grid */}
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[9px]">
              Load size
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LOAD_SIZES.map((s) => {
                const active = draft.loadSize === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      const autoFee = getAutoDumpFee(s.id, pricing);
                      setDraft((d) => ({
                        ...d,
                        loadSize: s.id,
                        ...(autoFee > 0 ? { dump: String(autoFee) } : {}),
                      }));
                      if (autoFee > 0) setDumpIsAuto(true);
                    }}
                    className={`p-3 rounded-[14px] flex flex-col items-center gap-[2px] transition-colors ${
                      active
                        ? "bg-qm-accent border border-qm-accent"
                        : "bg-qm-surface border border-qm-border"
                    }`}
                  >
                    <Truck
                      size={20}
                      className={active ? "text-white" : "text-qm-text-muted"}
                    />
                    <div
                      className={`text-[13px] font-bold mt-1 ${
                        active ? "text-white" : "text-qm-text"
                      }`}
                    >
                      {s.label}
                    </div>
                    <div
                      className={`text-[10.5px] ${
                        active ? "text-white/80" : "text-qm-text-muted"
                      }`}
                    >
                      {s.sub}
                    </div>
                    <div
                      className={`text-[12px] font-semibold mt-[2px] ${
                        active ? "text-white" : "text-qm-accent"
                      }`}
                    >
                      ${(truck as unknown as Record<string, number>)[s.id] ?? "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job type chips — multi-select */}
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[9px]">
              Job type
              <span className="text-qm-text-faint font-normal ml-1">
                · select all that apply
              </span>
            </div>
            <div className="flex flex-wrap gap-[6px]">
              {JOB_TYPES.map((j) => {
                const active = draft.jobTypes.includes(j);
                return (
                  <button
                    key={j}
                    onClick={() => {
                      set(
                        "jobTypes",
                        active
                          ? draft.jobTypes.filter((x) => x !== j)
                          : [...draft.jobTypes, j]
                      );
                    }}
                    className={`h-9 px-[14px] rounded-[10px] text-[13px] font-semibold transition-colors ${
                      active
                        ? "bg-qm-text text-qm-bg border border-qm-text"
                        : "bg-qm-surface text-qm-text border border-qm-border"
                    }`}
                  >
                    {j}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Complexity factors */}
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[9px]">
              Complexity factors
            </div>
            <div className="bg-qm-surface border border-qm-border rounded-2xl overflow-hidden">
              {COMPLEXITIES.map((c, i) => {
                const active = draft.complexity.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      const arr = draft.complexity;
                      set(
                        "complexity",
                        active
                          ? arr.filter((x) => x !== c.id)
                          : [...arr, c.id]
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-[14px] py-3 text-left transition-colors ${
                      i > 0 ? "border-t border-qm-border" : ""
                    }`}
                  >
                    {c.icon}
                    <span className="flex-1 text-[14px] font-medium text-qm-text">
                      {c.label}
                    </span>
                    <div
                      className={`w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 transition-colors ${
                        active
                          ? "bg-qm-accent border border-qm-accent"
                          : "border border-qm-border-strong"
                      }`}
                    >
                      {active && (
                        <Check size={14} className="text-white" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </StepShell>
      </div>
    );
  }

  // ── STEP 3: Costs ────────────────────────────────────────────────────────

  if (view === "costs") {
    return (
      <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
        <StepShell
          step={2}
          title="Cost inputs"
          subtitle="What's it going to cost you to do this job?"
          onBack={() => setView("job")}
          footer={
            <Btn onClick={() => setView("result")}>
              <Sparkles size={16} />
              Calculate quote
            </Btn>
          }
        >
          <Field
            label="Labor hours"
            value={draft.hours}
            onChange={(v) => set("hours", v)}
            suffix="hrs"
            placeholder="2.5"
          />
          <Field
            label="Crew size"
            value={draft.crew}
            onChange={(v) => set("crew", v)}
            suffix="people"
            placeholder="2"
          />
          {/* Dump fee with auto-hint and manual override indicator */}
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[7px] flex items-center gap-[6px]">
              Disposal / dump fee
              {!dumpIsAuto && (
                <span className="text-[10.5px] font-semibold px-[6px] py-[2px] rounded-[5px] bg-amber-100 text-amber-700">
                  manually set
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-qm-text-muted pointer-events-none">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={draft.dump}
                onChange={(e) => {
                  set("dump", e.target.value);
                  setDumpIsAuto(false);
                }}
                placeholder="60"
                className="w-full bg-qm-surface border border-qm-border rounded-xl pl-7 pr-3 py-[11px] text-[14px] text-qm-text placeholder:text-qm-text-faint outline-none focus:border-qm-accent transition-colors"
              />
            </div>
            <div className="mt-[6px] flex items-center gap-[5px] min-h-[18px]">
              {dumpIsAuto ? (
                pricing.dumpFeeMode === "flat_rate" ? (
                  <span className="text-[11.5px] text-qm-text-faint">
                    Flat rate for {LOAD_LABEL_MAP[draft.loadSize] || draft.loadSize}
                  </span>
                ) : pricing.dumpFeePerTon ? (
                  <span className="text-[11.5px] text-qm-text-faint">
                    Est. {DEFAULT_TONS[draft.loadSize] ?? 1.0} ton × ${pricing.dumpFeePerTon}/ton = ${draft.dump || "0"}
                  </span>
                ) : (
                  <span className="text-[11.5px] text-qm-text-faint">Default estimate</span>
                )
              ) : (
                <>
                  <span className="text-[11.5px] text-amber-600 font-medium">Manually overridden</span>
                  <span className="text-qm-text-faint text-[11.5px]">·</span>
                  <button
                    onClick={() => {
                      const autoFee = getAutoDumpFee(draft.loadSize, pricing);
                      set("dump", autoFee > 0 ? String(autoFee) : "");
                      setDumpIsAuto(true);
                    }}
                    className="text-[11.5px] text-qm-accent font-semibold"
                  >
                    Reset to auto
                  </button>
                </>
              )}
            </div>
          </div>
          <Field
            label="Travel / fuel"
            value={draft.travel}
            onChange={(v) => set("travel", v)}
            prefix="$"
            placeholder="25"
          />
          <Field
            label="Add-on fees"
            value={draft.addons}
            onChange={(v) => set("addons", v)}
            prefix="$"
            optional
            placeholder="0"
          />
          <Field
            label="Discount"
            value={draft.discount}
            onChange={(v) => set("discount", v)}
            prefix="$"
            optional
            placeholder="0"
          />
          {/* Per-quote target margin override */}
          <div>
            <div className="text-[13px] font-medium text-qm-text-muted mb-[7px] flex items-center gap-[6px]">
              Target margin
              {draft.targetMargin !== String(pricing.margin) && (
                <span className="text-[10.5px] font-semibold px-[6px] py-[2px] rounded-[5px] bg-amber-100 text-amber-700">
                  overridden
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={draft.targetMargin}
                onChange={(e) => set("targetMargin", e.target.value)}
                placeholder={String(pricing.margin)}
                className="w-full bg-qm-surface border border-qm-border rounded-xl pl-3 pr-9 py-[11px] text-[14px] text-qm-text placeholder:text-qm-text-faint outline-none focus:border-qm-accent transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-qm-text-muted pointer-events-none">%</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[5px] min-h-[18px]">
              {draft.targetMargin !== String(pricing.margin) ? (
                <>
                  <span className="text-[11.5px] text-amber-600 font-medium">
                    This quote only — default is {pricing.margin}%
                  </span>
                  <span className="text-qm-text-faint text-[11.5px]">·</span>
                  <button
                    onClick={() => set("targetMargin", String(pricing.margin))}
                    className="text-[11.5px] text-qm-accent font-semibold"
                  >
                    Reset
                  </button>
                </>
              ) : (
                <span className="text-[11.5px] text-qm-text-faint">
                  Your default · change globally in Settings
                </span>
              )}
            </div>
          </div>

          <Field
            label="Internal notes"
            value={draft.notes}
            onChange={(v) => set("notes", v)}
            multiline
            optional
            placeholder="Stairs to 2nd floor, customer wants couch off porch"
          />

          {/* Photos card */}
          <div className="bg-qm-surface border border-qm-border rounded-2xl p-[14px]">
            <div className="flex items-center gap-[10px]">
              <div className="w-[38px] h-[38px] rounded-[10px] bg-qm-surface-alt flex items-center justify-center shrink-0">
                <ImageIcon size={18} className="text-qm-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-qm-text">
                  Job photos
                </div>
                <div className="text-[11.5px] text-qm-text-muted mt-[1px]">
                  Confirm what you saw before pricing
                </div>
              </div>
              <button
                onClick={() => set("photosReviewed", !draft.photosReviewed)}
                className={`w-6 h-6 rounded-[7px] flex items-center justify-center shrink-0 transition-colors ${
                  draft.photosReviewed
                    ? "bg-qm-accent border border-qm-accent"
                    : "border border-qm-border-strong"
                }`}
              >
                {draft.photosReviewed && (
                  <Check size={14} className="text-white" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <input
              value={draft.photoNotes}
              onChange={(e) => set("photoNotes", e.target.value)}
              placeholder="Photo / job notes (couch + 4 boxes, garage door access)"
              className="mt-3 w-full border border-qm-border rounded-[10px] bg-qm-bg px-3 py-[10px] text-[14px] text-qm-text placeholder:text-qm-text-faint outline-none focus:border-qm-accent transition-colors"
            />
          </div>
        </StepShell>
      </div>
    );
  }

  // ── STEP 4: Result ───────────────────────────────────────────────────────

  if (view === "result") {
    return (
      <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg relative">
        <TopBar
          title="Quote summary"
          onBack={() => setView("costs")}
          trailing={
            <button
              onClick={() => setDraft((d) => ({ ...d, finalPrice: "" }))}
              className="p-2 rounded-full active:bg-qm-border"
              aria-label="Reset"
            >
              <RefreshCw size={18} className="text-qm-text" />
            </button>
          }
        />

        <div className="flex-1 overflow-y-auto px-[22px] py-2 pb-6">
          {/* Hero card */}
          <div
            className="rounded-[22px] p-[22px] relative overflow-hidden"
            style={{ background: "#0E1414", color: "#F4F6F4" }}
          >
            <div className="flex items-center gap-[6px] mb-[6px]">
              <Sparkles size={14} className="text-qm-accent" />
              <span className="text-[12px] font-semibold text-qm-accent uppercase tracking-[0.4px]">
                Recommended quote
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-semibold opacity-60">$</span>
              <span className="text-[64px] font-bold tracking-[-2.5px] leading-none">
                {calc.recommended}
              </span>
            </div>
            <div className="mt-1 text-[13px] opacity-65">
              Based on {calc.target}% target margin · {calc.loadLabel} ·{" "}
              {calc.crew} crew
            </div>

            {/* Editable final price */}
            <div
              className="mt-[18px] flex items-center gap-[10px] rounded-[14px] p-1"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex-1 px-[14px]">
                <div className="text-[11px] opacity-50 uppercase tracking-[0.4px] font-semibold">
                  Final quote
                </div>
                <div className="flex items-center gap-1">
                  <span className="opacity-55 text-[16px]">$</span>
                  <input
                    value={
                      draft.finalPrice !== ""
                        ? draft.finalPrice
                        : calc.recommended
                    }
                    onChange={(e) => set("finalPrice", e.target.value)}
                    inputMode="decimal"
                    style={{
                      background: "transparent",
                      color: "#F4F6F4",
                      border: "none",
                      outline: "none",
                      fontFamily: "inherit",
                      fontSize: 22,
                      fontWeight: 700,
                      letterSpacing: "-0.5px",
                      width: 90,
                      padding: 0,
                    }}
                  />
                </div>
              </div>
              <button
                onClick={() => set("finalPrice", "")}
                className="px-[14px] py-[10px] rounded-[11px] text-[13px] font-semibold text-white shrink-0"
                style={{ background: "var(--color-qm-accent)" }}
              >
                Use ${calc.recommended}
              </button>
            </div>
          </div>

          {/* Cost + Profit mini cards */}
          <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
            <div className="bg-qm-surface border border-qm-border rounded-[18px] p-[14px]">
              <div className="text-[11px] text-qm-text-muted font-semibold uppercase tracking-[0.4px]">
                Total cost
              </div>
              <div className="text-[24px] font-bold text-qm-text tracking-[-0.5px] mt-1">
                ${calc.cost}
              </div>
              <div className="text-[11px] text-qm-text-muted mt-[2px]">
                Labor + dump + fuel
              </div>
            </div>
            <div
              className="rounded-[18px] p-[14px]"
              style={{ background: "var(--color-qm-accent-soft)" }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.4px]"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                Your profit
              </div>
              <div
                className="text-[24px] font-bold tracking-[-0.5px] mt-1"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                ${calc.profit}
              </div>
              <div
                className="text-[11px] mt-[2px] opacity-80"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                What you keep
              </div>
            </div>
          </div>

          {/* Margin gauge card */}
          <div className="bg-qm-surface border border-qm-border rounded-[18px] p-4 mt-3">
            <div className="flex items-center justify-between mb-[14px]">
              <div>
                <div
                  className="text-[32px] font-bold tracking-[-0.8px] leading-none"
                  style={{ color: accentColor }}
                >
                  {calc.marginPct}%
                </div>
                <div className="text-[12px] text-qm-text-muted mt-[2px]">
                  Gross margin
                </div>
              </div>
              <div
                className="px-3 py-[6px] rounded-xl text-[13px] font-semibold"
                style={{
                  background: TONE_SOFT[calc.status],
                  color: accentColor,
                }}
              >
                {calc.status}
              </div>
            </div>
            <MarginGauge
              marginPct={calc.marginPct}
              target={calc.target}
              status={calc.status}
            />
          </div>

          {/* Status blurbs */}
          {calc.status === "Underpriced" && (
            <div
              className="mt-3 rounded-[14px] p-[14px] flex gap-[10px]"
              style={{ background: "var(--color-qm-danger-soft)" }}
            >
              <AlertTriangle
                size={18}
                style={{
                  color: "var(--color-qm-danger)",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <div>
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--color-qm-danger)" }}
                >
                  This quote may be too low
                </div>
                <div
                  className="text-[12px] mt-[2px] leading-[1.4] opacity-85"
                  style={{ color: "var(--color-qm-danger)" }}
                >
                  Try raising to <strong>${calc.recommended}</strong> to hit
                  your {calc.target}% margin target.
                </div>
              </div>
            </div>
          )}
          {calc.status === "Excellent" && (
            <div
              className="mt-3 rounded-[14px] p-[14px] flex gap-[10px]"
              style={{ background: "var(--color-qm-accent-soft)" }}
            >
              <Sparkles
                size={18}
                style={{
                  color: "var(--color-qm-accent-dark)",
                  flexShrink: 0,
                }}
              />
              <div
                className="text-[13px] font-medium leading-[1.4]"
                style={{ color: "var(--color-qm-accent-dark)" }}
              >
                Strong margin — this job protects your profit nicely.
              </div>
            </div>
          )}

          {/* Floor price card */}
          <div className="bg-qm-surface border border-qm-border rounded-[18px] p-[14px] mt-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-qm-text-muted font-semibold uppercase tracking-[0.4px]">
                  Don&apos;t go below
                </div>
                <div className="text-[13px] text-qm-text mt-1 leading-[1.4]">
                  Anything under{" "}
                  <strong style={{ color: "var(--color-qm-danger)" }}>
                    ${calc.floorPrice}
                  </strong>{" "}
                  loses money once costs are paid.
                </div>
              </div>
              <div
                className="p-2 px-3 rounded-[10px] text-center shrink-0"
                style={{ background: "var(--color-qm-danger-soft)" }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-[0.4px]"
                  style={{ color: "var(--color-qm-danger)" }}
                >
                  Floor
                </div>
                <div
                  className="text-[17px] font-bold tracking-[-0.3px]"
                  style={{ color: "var(--color-qm-danger)" }}
                >
                  ${calc.floorPrice}
                </div>
              </div>
            </div>
          </div>

          {/* Override reason */}
          {isOverridden && (
            <button
              onClick={() => setReasonSheet(true)}
              className="w-full mt-3 p-[14px] rounded-[12px] flex items-center gap-[10px] text-left"
              style={{
                background: draft.overrideReason
                  ? "var(--color-qm-accent-soft)"
                  : "var(--color-qm-surface)",
                border: `1px ${
                  draft.overrideReason ? "solid" : "dashed"
                } ${
                  draft.overrideReason
                    ? "var(--color-qm-accent)"
                    : "var(--color-qm-border-strong)"
                }`,
              }}
            >
              {draft.overrideReason ? (
                <Check
                  size={16}
                  style={{
                    color: "var(--color-qm-accent-dark)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <Pencil size={16} className="text-qm-text-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-semibold uppercase tracking-[0.3px]"
                  style={{
                    color: draft.overrideReason
                      ? "var(--color-qm-accent-dark)"
                      : undefined,
                  }}
                >
                  {draft.overrideReason ? "Override reason" : "Why the change?"}
                </div>
                <div className="text-[13px] text-qm-text mt-[2px]">
                  {draft.overrideReason || "Tap to log a reason (optional)"}
                </div>
              </div>
              <ChevronRight size={16} className="text-qm-text-muted shrink-0" />
            </button>
          )}

          {/* How calculated accordion */}
          <button
            onClick={() => setCalcOpen(!calcOpen)}
            className="w-full mt-3 p-[14px] bg-qm-surface border border-qm-border rounded-[12px] flex items-center gap-[10px] text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-qm-surface-alt flex items-center justify-center shrink-0">
              <Info size={16} className="text-qm-text-muted" />
            </div>
            <div className="flex-1 text-[13px] font-medium text-qm-text">
              How was this calculated?
            </div>
            <ChevronRight
              size={16}
              className={`text-qm-text-muted transition-transform duration-150 ${
                calcOpen ? "rotate-90" : ""
              }`}
            />
          </button>
          {calcOpen && (
            <div className="mt-[-2px] p-[14px] bg-qm-surface-alt rounded-b-[12px] text-[12.5px] text-qm-text leading-relaxed">
              <div className="font-semibold mb-[6px]">The math:</div>
              <div className="font-mono text-[11.5px] text-qm-text-muted bg-qm-surface p-[10px] rounded-lg mb-[10px]">
                base ${calc.loadPrice} + labor ${calc.laborCost} + dump $
                {calc.dump} + fuel ${calc.travel}
                <br />= costs ${calc.cost}
                <br />÷ (1 − {calc.target}%) ={" "}
                <strong className="text-qm-text">${calc.recommended}</strong>
              </div>
              <div className="text-qm-text-muted">
                We work backwards from your{" "}
                <strong className="text-qm-text">
                  {calc.target}% margin target
                </strong>{" "}
                in Settings, then add any add-ons and subtract discounts.
              </div>
            </div>
          )}

          {/* Cost breakdown — Pro only */}
          <div className="mt-[18px]">
            <div className="flex items-center justify-between px-1 py-[6px]">
              <div className="text-[12px] text-qm-text-muted font-semibold uppercase tracking-[0.4px]">
                Cost breakdown
              </div>
              {!isPro && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.3px] px-2 py-[3px] rounded-[6px]"
                  style={{
                    background: "var(--color-qm-accent-soft)",
                    color: "var(--color-qm-accent-dark)",
                  }}
                >
                  Pro
                </span>
              )}
            </div>
            {isPro ? (
              <div className="bg-qm-surface border border-qm-border rounded-[18px] px-[14px]">
                {[
                  {
                    label: `Base load (${calc.loadLabel})`,
                    value: calc.loadPrice,
                  },
                  {
                    label: `Labor · ${calc.crew}p × ${calc.hours}h`,
                    value: calc.laborCost,
                  },
                  { label: `Disposal / dump fee (est. ${calc.dumpTons} ton)`, value: calc.dump },
                  { label: "Travel / fuel", value: calc.travel },
                  ...(calc.addons > 0
                    ? [{ label: "Add-ons", value: calc.addons, plus: true }]
                    : []),
                  ...(calc.discount > 0
                    ? [{ label: "Discount", value: calc.discount, neg: true }]
                    : []),
                ].map((row, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-[9px] border-b border-qm-border last:border-0"
                  >
                    <span className="text-[13px] text-qm-text-muted">
                      {row.plus ? "+ " : row.neg ? "− " : ""}
                      {row.label}
                    </span>
                    <span
                      className={`text-[14px] font-medium ${
                        row.neg ? "text-qm-danger" : "text-qm-text"
                      }`}
                    >
                      {row.neg ? "−" : ""}${row.value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-3">
                  <span className="text-[14px] font-semibold text-qm-text">
                    Total quote
                  </span>
                  <span className="text-[18px] font-bold text-qm-text tracking-[-0.4px]">
                    ${finalPrice}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() =>
                  setUpgradePrompt({
                    title: "See your full cost breakdown",
                    body: "Upgrade to Pro to unlock line-by-line cost breakdowns on every quote — so you know exactly where your money goes.",
                  })
                }
                className="w-full bg-qm-surface border border-dashed border-qm-border-strong rounded-[18px] px-[14px] py-[16px] flex items-center justify-between"
              >
                <div className="text-left">
                  <div className="text-[13px] font-semibold text-qm-text">
                    Base load · Labor · Dump · Travel
                  </div>
                  <div className="text-[12px] text-qm-text-muted mt-[2px]">
                    Unlock full line-item breakdown with Pro
                  </div>
                </div>
                <Zap
                  size={18}
                  style={{ color: "var(--color-qm-accent)", flexShrink: 0 }}
                  strokeWidth={2.3}
                />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="mt-[18px] flex flex-col gap-[10px]">
            <Btn onClick={() => handleSaveAction("preview")}>
              <Receipt size={16} /> Preview quote
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => handleSaveAction("save")}
              disabled={saving}
            >
              <Check size={16} /> Save quote
            </Btn>
          </div>
        </div>

        {/* Override reason sheet */}
        {reasonSheet && (
          <Sheet
            title="Why the price change?"
            subtitle={`You're using $${finalPrice} instead of recommended $${calc.recommended}. Logging a reason helps you spot patterns later.`}
            onClose={() => setReasonSheet(false)}
          >
            <div className="flex flex-col gap-2">
              {OVERRIDE_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    set("overrideReason", r);
                    setReasonSheet(false);
                  }}
                  className="flex items-center gap-3 p-[14px] rounded-[12px] text-left text-[14px] font-medium text-qm-text"
                  style={{
                    background:
                      draft.overrideReason === r
                        ? "var(--color-qm-accent-soft)"
                        : "var(--color-qm-surface)",
                    border: `1px solid ${
                      draft.overrideReason === r
                        ? "var(--color-qm-accent)"
                        : "var(--color-qm-border)"
                    }`,
                  }}
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background:
                        draft.overrideReason === r
                          ? "var(--color-qm-accent)"
                          : "transparent",
                      border: `1.5px solid ${
                        draft.overrideReason === r
                          ? "var(--color-qm-accent)"
                          : "var(--color-qm-border-strong)"
                      }`,
                    }}
                  >
                    {draft.overrideReason === r && (
                      <div className="w-[6px] h-[6px] rounded-full bg-white" />
                    )}
                  </div>
                  {r}
                </button>
              ))}
              {draft.overrideReason && (
                <button
                  onClick={() => {
                    set("overrideReason", "");
                    setReasonSheet(false);
                  }}
                  className="mt-1 text-[13px] text-qm-text-muted font-medium py-2"
                >
                  Clear reason
                </button>
              )}
            </div>
          </Sheet>
        )}

        {/* Pro upgrade prompt (result view) */}
        {upgradePrompt && (
          <ProUpgradePrompt
            title={upgradePrompt.title}
            body={upgradePrompt.body}
            onClose={() => {
              setUpgradePrompt(null);
              // If quota was hit we've already saved — go to quotes
              if (isQuoteLimitHit || (!isPro && monthlyQuoteCount >= 4)) {
                router.push("/quotes");
              }
            }}
          />
        )}

        {/* Underpriced warning sheet */}
        {warnSheet && (
          <Sheet
            title="Heads up — this quote may lose money"
            subtitle={`You're at ${calc.marginPct}% margin (target ${calc.target}%). The recommended price is $${calc.recommended}.`}
            onClose={() => setWarnSheet(false)}
          >
            <div
              className="rounded-[12px] p-[14px] mb-[14px] flex gap-[10px]"
              style={{ background: "var(--color-qm-danger-soft)" }}
            >
              <AlertTriangle
                size={18}
                style={{ color: "var(--color-qm-danger)", flexShrink: 0 }}
              />
              <div
                className="text-[13px] leading-[1.5]"
                style={{ color: "var(--color-qm-danger)" }}
              >
                At <strong>${finalPrice}</strong>, you&apos;d take home about{" "}
                <strong>${calc.profit}</strong> after costs. Going below your
                floor of ${calc.floorPrice} means losing money on this job.
              </div>
            </div>
            <div className="flex flex-col gap-[10px]">
              <Btn
                onClick={() => {
                  set("finalPrice", String(calc.recommended));
                  setWarnSheet(false);
                }}
              >
                Use recommended ${calc.recommended}
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => {
                  const action = warnSheet;
                  setWarnSheet(false);
                  if (action === "preview") setView("preview");
                  else doSave("draft");
                }}
              >
                Send anyway at ${finalPrice}
              </Btn>
            </div>
          </Sheet>
        )}
      </div>
    );
  }

  // ── PREVIEW ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-surface-alt relative">
      <TopBar
        title="Customer view"
        subtitle="What they'll see"
        onBack={() => setView("result")}
      />

      <div className="flex-1 overflow-y-auto px-[22px] py-2 pb-6">
        {/* Paper quote */}
        <div
          className="bg-white rounded-[18px] p-[22px] text-[#0E1414]"
          style={{ boxShadow: "0 6px 22px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-full bg-qm-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold tracking-tight">
                {businessName}
              </div>
              <div className="text-[11px] text-[#5C6660]">
                {profile?.phone || "Your phone"} ·{" "}
                {profile?.email || "Your email"}
              </div>
            </div>
          </div>

          <div className="mt-[18px] pt-[14px] border-t border-black/8">
            <div className="text-[11px] text-[#5C6660] font-semibold uppercase tracking-[0.5px]">
              Quote for
            </div>
            <div className="text-[17px] font-semibold mt-[3px]">
              {draft.customer || "Customer"}
            </div>
            {draft.address && (
              <div className="text-[12px] text-[#5C6660] mt-[2px]">
                {draft.address}
              </div>
            )}
          </div>

          <div className="mt-[18px] py-[14px] border-y border-dashed border-black/12 flex justify-between items-center">
            <div>
              <div className="text-[11px] text-[#5C6660] font-semibold uppercase tracking-[0.5px]">
                Total
              </div>
              <div className="text-[36px] font-bold tracking-[-1px] mt-[2px]">
                ${finalPrice}
              </div>
            </div>
            <div
              className="px-3 py-2 rounded-[10px] text-center"
              style={{ background: "#E6F8F0", color: "#0B8F66" }}
            >
              <div className="text-[12px] font-semibold">Valid until</div>
              <strong className="text-[12px]">{fmt(expDate)}</strong>
            </div>
          </div>

          <div className="mt-[14px]">
            <div className="text-[11px] text-[#5C6660] font-semibold uppercase tracking-[0.5px]">
              Job summary
            </div>
            <div className="mt-2 text-[13px] text-[#0E1414] leading-[1.55]">
              {draft.jobTypes.length > 0 ? draft.jobTypes.join(", ") : "Junk removal"} · {calc.loadLabel} ·{" "}
              {calc.crew}-person crew, ~{calc.hours} hours.
              {draft.complexity.length > 0 &&
                ` Includes ${draft.complexity.join(", ")}.`}{" "}
              Includes loading, hauling, and all disposal fees.
            </div>
          </div>

          <div
            className="mt-4 p-[14px] rounded-[12px] flex gap-[10px] text-[11.5px] leading-[1.5]"
            style={{
              background: "#FFF7E6",
              border: "1px solid #FFE8B2",
              color: "#7A5800",
            }}
          >
            <span className="text-[14px] shrink-0">⚠️</span>
            <div>
              <strong style={{ color: "#5C4200" }}>
                Final price may change if the job scope changes on-site.
              </strong>{" "}
              Common reasons: extra items, access challenges, or hazardous
              materials.
            </div>
          </div>

          <div
            className="mt-3 p-3 rounded-[12px] text-[11px] leading-[1.5]"
            style={{ background: "#F7F7F5", color: "#5C6660" }}
          >
            <strong style={{ color: "#0E1414" }}>Terms:</strong> Quote valid
            for {expiryDays} days. Payment due on completion. Hazardous
            materials priced separately.
          </div>

          <div className="mt-4 text-[11px] text-[#8B938E] text-center">
            Generated with QuoteMate
          </div>
        </div>

        {/* Actions */}
        <div className="mt-[18px] flex flex-col gap-[10px]">
          <Btn onClick={() => setShareSheet(true)}>
            <Send size={16} /> Send to customer
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => doSave("sent")}
            disabled={saving}
          >
            <Check size={16} /> Mark as sent
          </Btn>
        </div>
      </div>

      {/* Copied toast */}
      {copied && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-qm-text text-qm-bg px-[18px] py-[10px] rounded-[12px] text-[13px] font-medium shadow-lg z-50 animate-[qmFadeIn_0.18s]">
          Copied to clipboard ✓
        </div>
      )}

      {/* Share sheet */}
      {shareSheet && (
        <Sheet
          title="Send to customer"
          subtitle="Choose how you'd like to share this quote."
          onClose={() => setShareSheet(false)}
        >
          <div className="flex flex-col gap-2">
            {([
              {
                id: "copy-text",
                label: "Copy text",
                sub: "Paste into any message app",
                icon: <Copy size={18} className="text-white" />,
                color: "#6B7280",
                proOnly: false,
                action: () => {
                  copy(
                    `Quote for ${draft.customer || "customer"}: $${finalPrice} — ${calc.loadLabel}` +
                    `${draft.jobTypes.length > 0 ? `, ${draft.jobTypes.join(", ")}` : ""}. Valid ${expiryDays} days. ${smsBody}`
                  );
                  setShareSheet(false);
                },
              },
              {
                id: "send-email",
                label: "Send via Email",
                sub: "For more formal quotes or businesses",
                icon: <Mail size={18} className="text-white" />,
                color: "#60A5FA",
                proOnly: true,
                action: () => { setShareSheet(false); setEmailSheet(true); },
              },
              ...(SMS_ENABLED ? [{
                id: "send-sms",
                label: "Send via Text",
                sub: "Fastest — most customers prefer this",
                icon: <MessageSquare size={18} className="text-white" />,
                color: "#34D399",
                proOnly: true,
                action: () => { setShareSheet(false); setSmsSheet(true); },
              }] : []),
              {
                id: "copy-link",
                label: "Copy link",
                sub: "Share a direct link to this quote",
                icon: <Link2 size={18} className="text-white" />,
                color: "#A78BFA",
                proOnly: true,
                action: handleCopyLink,
              },
            ] as const).map((item) => {
              const locked = item.proOnly && !isPro;
              return (
                <button
                  key={item.id}
                  onClick={locked ? () => setSendUpgradeOpen(true) : item.action}
                  className={`flex items-center gap-3 p-[12px] rounded-[14px] text-left border transition-opacity ${
                    locked
                      ? "bg-qm-surface-alt border-qm-border opacity-60"
                      : "bg-qm-surface border-qm-border"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: locked ? "#C4C9C6" : item.color }}
                  >
                    {locked ? (
                      <Lock size={15} className="text-white" strokeWidth={2.5} />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-qm-text">
                      {item.label}
                    </div>
                    <div className="text-[12px] text-qm-text-muted mt-[1px]">
                      {locked ? "Pro feature — tap to learn more" : item.sub}
                    </div>
                  </div>
                  {locked ? (
                    <Lock size={14} className="text-qm-text-faint shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-qm-text-muted shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}

      {/* SMS sheet — hidden until SMS_ENABLED */}
      {SMS_ENABLED && smsSheet && (
        <Sheet
          title="Text message preview"
          subtitle={`To: ${draft.customer || "Customer"}${draft.phone ? ` · ${draft.phone}` : ""}`}
          onClose={() => {
            if (!smsSending && !smsSent) {
              setSmsSheet(false);
              setSmsError(null);
            }
          }}
        >
          {smsSent ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-qm-accent)" }}
              >
                <Check size={28} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="text-[17px] font-bold text-qm-text">Text sent!</div>
              <div className="text-[13px] text-qm-text-muted text-center leading-relaxed">
                Your quote was sent to {draft.customer || "the customer"}.
                <br />Redirecting to your quotes…
              </div>
            </div>
          ) : (
            <>
              <div
                className="rounded-[18px] p-[12px] text-[14px] leading-[1.5]"
                style={{ background: "#E5F0FF", color: "#0A2540" }}
              >
                {smsBody}
              </div>
              <div className="text-[11px] text-qm-text-muted mt-2 text-right">
                {smsBody.length} characters
              </div>
              {smsError && (
                <div
                  className="mt-3 rounded-[10px] px-[12px] py-[10px] text-[13px] font-medium leading-snug"
                  style={{
                    background: "var(--color-qm-danger-soft)",
                    color: "var(--color-qm-danger)",
                  }}
                >
                  {smsError}
                </div>
              )}
              <div className="mt-[14px] flex flex-col gap-[10px]">
                <Btn onClick={handleSendSms} disabled={smsSending}>
                  {smsSending ? (
                    "Sending…"
                  ) : (
                    <><MessageSquare size={16} /> Send text message</>
                  )}
                </Btn>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    copy(smsBody);
                    setSmsSheet(false);
                  }}
                >
                  <Copy size={16} /> Copy instead
                </Btn>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* Send-context upgrade prompt — stays on screen after dismiss */}
      {sendUpgradeOpen && (
        <ProUpgradePrompt
          title="Send quotes directly from QuoteMate"
          body="Send professional quotes directly from QuoteMate with Pro. $19/month — cancel any time."
          onClose={() => setSendUpgradeOpen(false)}
        />
      )}

      {/* Quota-limit upgrade prompt — navigates to /quotes after dismiss */}
      {upgradePrompt && !sendUpgradeOpen && (
        <ProUpgradePrompt
          title={upgradePrompt.title}
          body={upgradePrompt.body}
          onClose={() => {
            setUpgradePrompt(null);
            if (isQuoteLimitHit || (!isPro && monthlyQuoteCount >= 4)) {
              router.push("/quotes");
            }
          }}
        />
      )}

      {/* Email sheet */}
      {emailSheet && (
        <Sheet
          title="Email preview"
          subtitle={`To: ${draft.email || "Customer email"}`}
          onClose={() => {
            if (!emailSending && !emailSent) {
              setEmailSheet(false);
              setEmailError(null);
            }
          }}
        >
          {emailSent ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-qm-accent)" }}
              >
                <Check size={28} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="text-[17px] font-bold text-qm-text">Email sent!</div>
              <div className="text-[13px] text-qm-text-muted text-center leading-relaxed">
                Your quote was emailed to {draft.customer || "the customer"}.
                <br />Redirecting to your quotes…
              </div>
            </div>
          ) : (
            <>
              <div className="bg-qm-surface border border-qm-border rounded-[12px] p-[14px]">
                <div className="text-[11px] text-qm-text-muted font-semibold uppercase tracking-[0.4px]">
                  Subject
                </div>
                <div className="text-[14px] font-semibold text-qm-text mt-[3px] mb-3">
                  Your quote from {businessName} — ${finalPrice}
                </div>
                <div className="text-[13px] text-qm-text leading-[1.55] whitespace-pre-wrap">
                  {emailBody}
                </div>
              </div>
              {emailError && (
                <div
                  className="mt-3 rounded-[10px] px-[12px] py-[10px] text-[13px] font-medium leading-snug"
                  style={{
                    background: "var(--color-qm-danger-soft)",
                    color: "var(--color-qm-danger)",
                  }}
                >
                  {emailError}
                </div>
              )}
              <div className="mt-[14px] flex flex-col gap-[10px]">
                <Btn onClick={handleSendEmail} disabled={emailSending}>
                  {emailSending ? (
                    "Sending…"
                  ) : (
                    <><Send size={16} /> Send email</>
                  )}
                </Btn>
                <Btn
                  variant="secondary"
                  onClick={() => {
                    copy(emailBody);
                    setEmailSheet(false);
                  }}
                >
                  <Copy size={16} /> Copy instead
                </Btn>
              </div>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}
