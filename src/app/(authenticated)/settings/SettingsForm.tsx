"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Check, CreditCard, Zap, Lock, ChevronRight, Mail } from "lucide-react";
import type { Profile, TruckloadPricing } from "@/types/database";
import { getEffectiveSubStatus, trialDaysLeft } from "@/lib/subscription";
import { getTier } from "@/lib/tier";
import { ProUpgradePrompt } from "@/components/ProUpgradePrompt";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.6px] mb-3">
      {label}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  optional,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  prefix?: string;
  suffix?: string;
  optional?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <div className="text-[13px] font-medium text-qm-text-muted mb-[7px] flex items-center gap-1.5">
        {label}
        {optional && (
          <span className="text-qm-text-faint font-normal">· optional</span>
        )}
      </div>
      <div className="flex items-center bg-qm-surface border border-qm-border rounded-[14px] px-[14px] h-[52px]">
        {prefix && (
          <span className="text-qm-text-muted text-[17px] font-medium mr-1.5 shrink-0">
            {prefix}
          </span>
        )}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-[17px] text-qm-text placeholder:text-qm-text-faint min-w-0"
        />
        {suffix && (
          <span className="text-qm-text-muted text-[14px] ml-1 shrink-0">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function TruckField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-qm-text-muted mb-[6px]">
        {label}
      </div>
      <div className="flex items-center bg-qm-surface border border-qm-border rounded-[12px] px-3 h-[46px]">
        <span className="text-qm-text-muted text-[15px] font-medium mr-1 shrink-0">
          $
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-qm-text min-w-0"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsForm({
  profile,
  userId,
  userEmail,
}: {
  profile: Partial<Profile>;
  userId: string;
  userEmail?: string;
}) {
  const router = useRouter();
  const tp = profile.truckload_pricing;
  const fdf = profile.flat_dump_fees as Record<string, number> | null;

  const [form, setForm] = useState({
    businessName: profile.business_name ?? "",
    ownerName: profile.owner_name ?? "",
    phone: profile.phone ?? "",
    email: profile.email ?? "",
    serviceArea: profile.service_area ?? "",
    minPrice: String(profile.min_price ?? 125),
    targetMargin: String(profile.target_margin ?? 45),
    laborRate: String(profile.labor_rate ?? 35),
    crewSize: String(profile.default_crew_size ?? 2),
    travelFee: String(profile.default_travel_fee ?? 25),
    expiryDays: String(profile.quote_expiry_days ?? 7),
    dumpFeePerTon: String(profile.dump_fee_per_ton ?? ""),
    truckMin: String(tp?.min ?? 95),
    truckEight: String(tp?.eight ?? 145),
    truckQtr: String(tp?.qtr ?? 225),
    truckHalf: String(tp?.half ?? 325),
    truckThree: String(tp?.three ?? 475),
    truckFull: String(tp?.full ?? 625),
    truckMultiple: String(tp?.multiple ?? 850),
  });

  const [dumpMode, setDumpMode] = useState<"per_ton" | "flat_rate">(
    (profile.dump_fee_mode as "per_ton" | "flat_rate") ?? "per_ton"
  );
  const [flatFees, setFlatFees] = useState({
    min: String(fdf?.min ?? ""),
    eight: String(fdf?.eight ?? ""),
    qtr: String(fdf?.qtr ?? ""),
    half: String(fdf?.half ?? ""),
    three: String(fdf?.three ?? ""),
    full: String(fdf?.full ?? ""),
    multiple: String(fdf?.multiple ?? ""),
  });

  const cf = profile.complexity_fees as Record<string, number> | null;
  const [surcharges, setSurcharges] = useState({
    stairs: String(cf?.stairs ?? 25),
    basement: String(cf?.basement ?? 25),
    longCarry: String(cf?.longCarry ?? 25),
    heavy: String(cf?.heavy ?? 25),
    rush: String(cf?.rush ?? 50),
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Subscription info
  const subStatus = getEffectiveSubStatus(profile);
  const daysLeft = trialDaysLeft(profile.trial_ends_at);
  const hasStripeCustomer = !!profile.stripe_customer_id;
  const tier = getTier(profile);
  const isPro = tier === "pro";
  const hasUsedTrial = profile.has_used_trial ?? false;

  function set(key: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [key]: v }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase
        .from("profiles")
        .update({
          business_name: form.businessName || null,
          owner_name: form.ownerName || null,
          phone: form.phone || null,
          email: form.email || null,
          service_area: form.serviceArea || null,
          min_price: parseFloat(form.minPrice) || 125,
          target_margin: parseFloat(form.targetMargin) || 45,
          labor_rate: parseFloat(form.laborRate) || 35,
          default_crew_size: parseInt(form.crewSize) || 2,
          default_travel_fee: parseFloat(form.travelFee) || 25,
          quote_expiry_days: parseInt(form.expiryDays) || 7,
          dump_fee_per_ton: dumpMode === "per_ton" && form.dumpFeePerTon ? parseFloat(form.dumpFeePerTon) || null : null,
          dump_fee_mode: dumpMode,
          flat_dump_fees: dumpMode === "flat_rate" ? {
            min: parseFloat(flatFees.min) || 0,
            eight: parseFloat(flatFees.eight) || 0,
            qtr: parseFloat(flatFees.qtr) || 0,
            half: parseFloat(flatFees.half) || 0,
            three: parseFloat(flatFees.three) || 0,
            full: parseFloat(flatFees.full) || 0,
            multiple: parseFloat(flatFees.multiple) || 0,
          } : null,
          truckload_pricing: {
            min: parseFloat(form.truckMin) || 95,
            eight: parseFloat(form.truckEight) || 145,
            qtr: parseFloat(form.truckQtr) || 225,
            half: parseFloat(form.truckHalf) || 325,
            three: parseFloat(form.truckThree) || 475,
            full: parseFloat(form.truckFull) || 625,
            multiple: parseFloat(form.truckMultiple) || 850,
          } as TruckloadPricing,
          ...(isPro && {
            complexity_fees: {
              stairs: parseFloat(surcharges.stairs) || 25,
              basement: parseFloat(surcharges.basement) || 25,
              longCarry: parseFloat(surcharges.longCarry) || 25,
              heavy: parseFloat(surcharges.heavy) || 25,
              rush: parseFloat(surcharges.rush) || 50,
            },
          }),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (err) throw err;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      router.push("/login");
    }
  }

  async function handleSubscribe() {
    setBillingLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout?plan=pro_upgrade", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Couldn't open checkout.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError(data.error || "Couldn't open billing portal.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-92px)] bg-qm-bg">
      {/* Header */}
      <div className="pt-[56px] px-[22px] pb-4 shrink-0">
        <div className="text-[12px] text-qm-text-muted font-medium">
          Account &amp; business
        </div>
        <div className="text-[26px] font-bold text-qm-text tracking-[-0.6px]">
          Settings
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pb-6">
        <div className="flex flex-col gap-7">
          {/* ── Business ── */}
          <div>
            <SectionHeader label="Business" />
            <div className="flex flex-col gap-3">
              <Field
                label="Business name"
                value={form.businessName}
                onChange={set("businessName")}
                placeholder="Sarah's Junk Removal"
                optional
              />
              <Field
                label="Your name"
                value={form.ownerName}
                onChange={set("ownerName")}
                placeholder="Sarah Johnson"
                optional
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={set("phone")}
                placeholder="(555) 218-7740"
                type="tel"
                optional
              />
              <Field
                label="Contact email"
                value={form.email}
                onChange={set("email")}
                placeholder="sarah@example.com"
                type="email"
                optional
              />
              <Field
                label="Service area"
                value={form.serviceArea}
                onChange={set("serviceArea")}
                placeholder="Austin, TX"
                optional
              />
            </div>
          </div>

          {/* ── Pricing defaults ── */}
          <div>
            <SectionHeader label="Pricing defaults" />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Min price"
                value={form.minPrice}
                onChange={set("minPrice")}
                placeholder="125"
                type="number"
                inputMode="numeric"
                prefix="$"
              />
              <Field
                label="Target margin"
                value={form.targetMargin}
                onChange={set("targetMargin")}
                placeholder="45"
                type="number"
                inputMode="numeric"
                suffix="%"
              />
              <Field
                label="Labor rate"
                value={form.laborRate}
                onChange={set("laborRate")}
                placeholder="35"
                type="number"
                inputMode="numeric"
                prefix="$"
                suffix="/hr"
              />
              <Field
                label="Crew size"
                value={form.crewSize}
                onChange={set("crewSize")}
                placeholder="2"
                type="number"
                inputMode="numeric"
                suffix="ppl"
              />
              <Field
                label="Travel fee"
                value={form.travelFee}
                onChange={set("travelFee")}
                placeholder="25"
                type="number"
                inputMode="numeric"
                prefix="$"
              />
              <Field
                label="Quote expiry"
                value={form.expiryDays}
                onChange={set("expiryDays")}
                placeholder="7"
                type="number"
                inputMode="numeric"
                suffix="days"
              />
            </div>
            {/* Dump fee mode toggle + inputs — full width */}
            <div className="mt-3 col-span-2">
              <div className="text-[13px] font-medium text-qm-text-muted mb-[9px]">
                Disposal / dump fee method
              </div>
              {/* Segmented control */}
              <div className="flex rounded-[12px] bg-qm-surface border border-qm-border overflow-hidden mb-3">
                {(["per_ton", "flat_rate"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDumpMode(mode)}
                    className={`flex-1 py-[10px] text-[13px] font-semibold transition-colors ${
                      dumpMode === mode
                        ? "bg-qm-accent text-white"
                        : "text-qm-text-muted"
                    }`}
                  >
                    {mode === "per_ton" ? "Per ton" : "Flat rate"}
                  </button>
                ))}
              </div>

              {dumpMode === "per_ton" ? (
                <>
                  <Field
                    label="Dump fee per ton"
                    value={form.dumpFeePerTon}
                    onChange={set("dumpFeePerTon")}
                    placeholder="75"
                    type="number"
                    inputMode="decimal"
                    prefix="$"
                    suffix="/ton"
                    optional
                  />
                  <div className="mt-[6px] text-[11.5px] text-qm-text-faint leading-snug px-1">
                    Auto-calculates per load: min 0.1t · ⅛ 0.25t · ¼ 0.5t · ½ 1.0t · ¾ 1.5t · full 2.0t · multiple 4.0t
                  </div>
                </>
              ) : (
                <>
                  <div className="text-[12px] text-qm-text-faint mb-2 px-1">
                    Set a fixed disposal fee for each load size
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "min", label: "Minimum" },
                      { key: "eight", label: "1/8 truck" },
                      { key: "qtr", label: "1/4 truck" },
                      { key: "half", label: "1/2 truck" },
                      { key: "three", label: "3/4 truck" },
                      { key: "full", label: "Full truck" },
                      { key: "multiple", label: "Multiple" },
                    ] as const).map(({ key, label }) => (
                      <TruckField
                        key={key}
                        label={label}
                        value={flatFees[key]}
                        onChange={(v) => setFlatFees((f) => ({ ...f, [key]: v }))}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Truckload pricing ── */}
          <div>
            <SectionHeader label="Truckload pricing" />
            <div className="grid grid-cols-2 gap-3">
              <TruckField
                label="Minimum"
                value={form.truckMin}
                onChange={set("truckMin")}
              />
              <TruckField
                label="1/8 load"
                value={form.truckEight}
                onChange={set("truckEight")}
              />
              <TruckField
                label="1/4 load"
                value={form.truckQtr}
                onChange={set("truckQtr")}
              />
              <TruckField
                label="1/2 load"
                value={form.truckHalf}
                onChange={set("truckHalf")}
              />
              <TruckField
                label="3/4 load"
                value={form.truckThree}
                onChange={set("truckThree")}
              />
              <TruckField
                label="Full load"
                value={form.truckFull}
                onChange={set("truckFull")}
              />
              <TruckField
                label="Multiple trucks"
                value={form.truckMultiple}
                onChange={set("truckMultiple")}
              />
            </div>
          </div>

          {/* ── Complexity surcharges ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader label="Complexity surcharges" />
              {!isPro && (
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.3px] px-2 py-[3px] rounded-[6px] -mt-3"
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
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "stairs", label: "Stairs" },
                    { key: "basement", label: "Basement" },
                    { key: "longCarry", label: "Long carry" },
                    { key: "heavy", label: "Heavy / bulky" },
                    { key: "rush", label: "Same-day rush" },
                  ] as const
                ).map(({ key, label }) => (
                  <TruckField
                    key={key}
                    label={label}
                    value={surcharges[key]}
                    onChange={(v) =>
                      setSurcharges((s) => ({ ...s, [key]: v }))
                    }
                  />
                ))}
              </div>
            ) : (
              <button
                onClick={() => setShowUpgrade(true)}
                className="w-full border border-dashed border-qm-border-strong rounded-2xl px-[14px] py-[14px] flex items-center gap-3 text-left"
                style={{ background: "var(--color-qm-surface-alt)" }}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-qm-accent-soft)" }}
                >
                  <Lock
                    size={17}
                    style={{ color: "var(--color-qm-accent)" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold text-qm-text">
                    Customize surcharges with Pro
                  </div>
                  <div className="text-[12px] text-qm-text-muted mt-[2px]">
                    Stairs · Basement · Long carry · Rush
                  </div>
                </div>
                <Zap
                  size={16}
                  style={{ color: "var(--color-qm-accent)", flexShrink: 0 }}
                  strokeWidth={2.3}
                />
              </button>
            )}
          </div>

          {/* ── Subscription ── */}
          <div>
            <SectionHeader label="Subscription" />
            <div className="flex flex-col gap-3">
              {/* Status card */}
              <div className="bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px] flex items-center justify-between">
                <div>
                  <div className="text-[12px] text-qm-text-muted font-medium mb-[3px]">
                    Plan
                  </div>
                  <div className="text-[15px] text-qm-text font-semibold">
                    {isPro ? "QuoteMate Pro · $19/mo" : "QuoteMate Free"}
                  </div>
                </div>
                {/* Status badge */}
                {subStatus === "active" && (
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--color-qm-accent-soft)",
                      color: "var(--color-qm-accent-dark)",
                    }}
                  >
                    Active
                  </span>
                )}
                {(subStatus === "trialing" || subStatus === "trial_ending") && (
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--color-qm-warn-soft)",
                      color: "var(--color-qm-warn)",
                    }}
                  >
                    {daysLeft > 0 ? `${daysLeft}d trial` : "Trial"}
                  </span>
                )}
                {subStatus === "past_due" && (
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--color-qm-danger-soft)",
                      color: "var(--color-qm-danger)",
                    }}
                  >
                    Past due
                  </span>
                )}
                {subStatus === "expired" && (
                  <span
                    className="text-[12px] font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--color-qm-surface-alt)",
                      color: "var(--color-qm-text-muted)",
                    }}
                  >
                    Free
                  </span>
                )}
              </div>

              {/* Manage billing — only for active subscribers and past-due accounts */}
              {hasStripeCustomer && (subStatus === "active" || subStatus === "trialing" || subStatus === "trial_ending" || subStatus === "past_due") && (
                <button
                  onClick={handleManageBilling}
                  disabled={billingLoading}
                  className="w-full flex items-center gap-3 bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px] active:opacity-70 transition-opacity"
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: "var(--color-qm-accent-soft)" }}
                  >
                    <CreditCard
                      size={17}
                      style={{ color: "var(--color-qm-accent-dark)" }}
                    />
                  </div>
                  <span className="text-[15px] font-semibold text-qm-text">
                    {billingLoading ? "Opening…" : "Manage billing"}
                  </span>
                </button>
              )}

              {/* Subscribe CTA — free tier only, hidden for active subscribers and trial users */}
              {!isPro && (
                <button
                  onClick={handleSubscribe}
                  disabled={billingLoading}
                  className="w-full h-12 rounded-[14px] flex items-center justify-center gap-2 text-[15px] font-semibold text-white"
                  style={{
                    background: "var(--color-qm-accent)",
                    opacity: billingLoading ? 0.7 : 1,
                  }}
                >
                  <Zap size={16} strokeWidth={2.3} />
                  {billingLoading
                ? "Opening checkout…"
                : hasUsedTrial
                ? "Upgrade to Pro — $19/month"
                : "Try Pro free for 14 days — no charge until day 15"}
                </button>
              )}

              {/* Free → compare plans link */}
              {!isPro && (
                <Link
                  href="/upgrade"
                  className="w-full flex items-center gap-3 bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px] active:opacity-70 transition-opacity"
                >
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: "var(--color-qm-accent-soft)" }}
                  >
                    <Zap
                      size={17}
                      style={{ color: "var(--color-qm-accent)" }}
                      strokeWidth={2.3}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-[15px] font-semibold text-qm-text">
                      What&apos;s included in Pro?
                    </div>
                    <div className="text-[12px] text-qm-text-muted mt-[1px]">
                      Compare Free vs Pro features
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-qm-text-muted shrink-0" />
                </Link>
              )}

              {/* Pro → already subscribed confirmation */}
              {isPro && (
                <div
                  className="flex items-center gap-3 rounded-2xl px-[14px] py-[13px]"
                  style={{
                    background: "var(--color-qm-accent-soft)",
                    border: "1px solid var(--color-qm-accent)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--color-qm-accent)" }}
                  >
                    <Check size={17} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div
                      className="text-[15px] font-bold"
                      style={{ color: "var(--color-qm-accent-dark)" }}
                    >
                      You&apos;re using QuoteMate Pro
                    </div>
                    <div
                      className="text-[12px] mt-[1px] opacity-85"
                      style={{ color: "var(--color-qm-accent-dark)" }}
                    >
                      All features are unlocked.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Account ── */}
          <div>
            <SectionHeader label="Account" />
            <div className="flex flex-col gap-3">
              {userEmail && (
                <div className="bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px]">
                  <div className="text-[12px] text-qm-text-muted font-medium mb-[3px]">
                    Signed in as
                  </div>
                  <div className="text-[15px] text-qm-text font-semibold">
                    {userEmail}
                  </div>
                </div>
              )}

              <a
                href="mailto:support@goquotemate.com"
                className="w-full flex items-center gap-3 bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px] active:opacity-70 transition-opacity"
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-qm-surface-alt)" }}
                >
                  <Mail
                    size={17}
                    style={{ color: "var(--color-qm-text-muted)" }}
                  />
                </div>
                <span className="text-[15px] font-semibold text-qm-text-muted">
                  Contact Support
                </span>
              </a>

              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-[13px] active:opacity-70 transition-opacity"
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-qm-danger-soft)" }}
                >
                  <LogOut
                    size={17}
                    style={{ color: "var(--color-qm-danger)" }}
                  />
                </div>
                <span
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--color-qm-danger)" }}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </span>
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div
              className="text-[13px] font-medium text-center rounded-[12px] py-[10px] px-3"
              style={{
                background: "var(--color-qm-danger-soft)",
                color: "var(--color-qm-danger)",
              }}
            >
              {error}
            </div>
          )}

          {/* ── Save button ── */}
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="h-14 rounded-[16px] flex items-center justify-center gap-2 text-[17px] font-semibold text-white transition-all"
            style={{
              background: saved
                ? "var(--color-qm-accent-dark)"
                : "var(--color-qm-accent)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? (
              <>
                <Check size={20} strokeWidth={2.5} />
                Saved!
              </>
            ) : saving ? (
              "Saving…"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>

      {/* Pro upgrade prompt */}
      {showUpgrade && (
        <ProUpgradePrompt
          title="Customize surcharges with Pro"
          body={hasUsedTrial
            ? "Upgrade to Pro to set your own fees for stairs, basement, long carry, heavy items, and rush jobs."
            : "Upgrade to Pro to set your own fees for stairs, basement, long carry, heavy items, and rush jobs. Start your 14-day free trial — no charge until day 15."}
          hasUsedTrial={hasUsedTrial}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}
