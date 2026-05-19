"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import type { Profile } from "@/types/database";

// ─── Constants ────────────────────────────────────────────────────────────────

// step indices: 0=welcome, 1=business, 2=labor, 3=trucks, 4=done
const TOTAL_SETUP_STEPS = 3; // steps 1–3 show progress bar

const LOAD_SIZES = [
  { id: "min",      label: "Minimum",        hint: "A few small items" },
  { id: "eight",    label: "⅛ Truck",         hint: "1–2 items" },
  { id: "qtr",      label: "¼ Truck",         hint: "Couch, mattress + extras" },
  { id: "half",     label: "½ Truck",         hint: "Small room cleanout" },
  { id: "three",    label: "¾ Truck",         hint: "Garage / large room" },
  { id: "full",     label: "Full Truck",      hint: "Full clean-out" },
  { id: "multiple", label: "Multiple Trucks", hint: "Large estate / commercial" },
] as const;

type LoadId = typeof LOAD_SIZES[number]["id"];

const DEFAULT_TRUCK_PRICES: Record<LoadId, string> = {
  min: "95", eight: "145", qtr: "225", half: "325",
  three: "475", full: "625", multiple: "850",
};
const DEFAULT_DUMP_FEES: Record<LoadId, string> = {
  min: "15", eight: "25", qtr: "40", half: "60",
  three: "80", full: "100", multiple: "175",
};

// ─── Shared primitives ────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  prefix,
  suffix,
  optional,
  required,
  hasError,
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
  required?: boolean;
  hasError?: boolean;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <div className="text-[13px] font-medium text-qm-text-muted mb-[7px] flex items-center gap-1.5">
        {label}
        {optional && (
          <span className="text-qm-text-faint font-normal">· optional</span>
        )}
        {required && (
          <span style={{ color: "var(--color-qm-accent)" }} className="font-normal">
            · required
          </span>
        )}
      </div>
      <div
        className="flex items-center bg-qm-surface rounded-[14px] px-[14px] h-[52px]"
        style={{
          border: hasError
            ? "1.5px solid var(--color-qm-danger)"
            : "1px solid var(--color-qm-border)",
        }}
      >
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

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressHeader({
  step,
  onSkip,
  saving,
}: {
  step: 1 | 2 | 3;
  onSkip: () => void;
  saving: boolean;
}) {
  const pct = Math.round((step / TOTAL_SETUP_STEPS) * 100);
  return (
    <div className="shrink-0 px-[22px] pt-[56px] pb-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold text-qm-text-muted">
          Step {step} of {TOTAL_SETUP_STEPS}
        </span>
        <button
          onClick={onSkip}
          disabled={saving}
          className="text-[13px] font-semibold text-qm-text-muted disabled:opacity-50"
        >
          Skip
        </button>
      </div>
      <div className="w-full h-1 rounded-full" style={{ background: "var(--color-qm-border)" }}>
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: "var(--color-qm-accent)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function OnboardingFlow({
  profile,
  userId,
}: {
  profile: Partial<Profile>;
  userId: string;
}) {
  const router = useRouter();
  const tp = profile.truckload_pricing;
  const fdf = profile.flat_dump_fees as Record<string, number> | null;

  // Resume at whichever step the DB says, clamped to 0–3
  const initialStep = Math.min(Math.max(profile.onboarding_step ?? 0, 0), 3);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(initialStep as 0 | 1 | 2 | 3 | 4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 state ────────────────────────────────────────────────────────────
  const [biz, setBiz] = useState({
    businessName: profile.business_name ?? "",
    ownerName: profile.owner_name ?? "",
    phone: profile.phone ?? "",
    minPrice: String(profile.min_price ?? 75),
    targetMargin: String(profile.target_margin ?? 40),
  });
  const [bizErrors, setBizErrors] = useState({ businessName: false, ownerName: false });

  // ── Step 2 state ────────────────────────────────────────────────────────────
  const [labor, setLabor] = useState({
    laborRate: String(profile.labor_rate ?? 25),
    crewSize: String(profile.default_crew_size ?? 2),
    travelFee: String(profile.default_travel_fee ?? 15),
  });

  // ── Step 3 state ────────────────────────────────────────────────────────────
  const [truckPrices, setTruckPrices] = useState<Record<LoadId, string>>({
    min:      String(tp?.min      ?? DEFAULT_TRUCK_PRICES.min),
    eight:    String(tp?.eight    ?? DEFAULT_TRUCK_PRICES.eight),
    qtr:      String(tp?.qtr      ?? DEFAULT_TRUCK_PRICES.qtr),
    half:     String(tp?.half     ?? DEFAULT_TRUCK_PRICES.half),
    three:    String(tp?.three    ?? DEFAULT_TRUCK_PRICES.three),
    full:     String(tp?.full     ?? DEFAULT_TRUCK_PRICES.full),
    multiple: String(tp?.multiple ?? DEFAULT_TRUCK_PRICES.multiple),
  });
  const [dumpFees, setDumpFees] = useState<Record<LoadId, string>>({
    min:      String(fdf?.min      ?? DEFAULT_DUMP_FEES.min),
    eight:    String(fdf?.eight    ?? DEFAULT_DUMP_FEES.eight),
    qtr:      String(fdf?.qtr      ?? DEFAULT_DUMP_FEES.qtr),
    half:     String(fdf?.half     ?? DEFAULT_DUMP_FEES.half),
    three:    String(fdf?.three    ?? DEFAULT_DUMP_FEES.three),
    full:     String(fdf?.full     ?? DEFAULT_DUMP_FEES.full),
    multiple: String(fdf?.multiple ?? DEFAULT_DUMP_FEES.multiple),
  });
  const [dumpMode, setDumpMode] = useState<"per_ton" | "flat_rate">(
    (profile.dump_fee_mode as "per_ton" | "flat_rate") ?? "per_ton"
  );
  const [dumpFeePerTon, setDumpFeePerTon] = useState(
    String(profile.dump_fee_per_ton ?? "")
  );

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function buildTruckPricing() {
    return {
      min:      parseFloat(truckPrices.min)      || 95,
      eight:    parseFloat(truckPrices.eight)    || 145,
      qtr:      parseFloat(truckPrices.qtr)      || 225,
      half:     parseFloat(truckPrices.half)     || 325,
      three:    parseFloat(truckPrices.three)    || 475,
      full:     parseFloat(truckPrices.full)     || 625,
      multiple: parseFloat(truckPrices.multiple) || 850,
    };
  }

  function buildDumpFees() {
    return {
      min:      parseFloat(dumpFees.min)      || 15,
      eight:    parseFloat(dumpFees.eight)    || 25,
      qtr:      parseFloat(dumpFees.qtr)      || 40,
      half:     parseFloat(dumpFees.half)     || 60,
      three:    parseFloat(dumpFees.three)    || 80,
      full:     parseFloat(dumpFees.full)     || 100,
      multiple: parseFloat(dumpFees.multiple) || 175,
    };
  }

  async function supabaseUpdate(data: Record<string, unknown>) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  // ── Step handlers ────────────────────────────────────────────────────────────

  async function handleWelcomeNext() {
    setSaving(true);
    try {
      await supabaseUpdate({ onboarding_step: 1 });
      setStep(1);
    } catch {
      setStep(1); // proceed even if save fails
    } finally {
      setSaving(false);
    }
  }

  async function handleBizNext() {
    setError(null);
    if (!biz.businessName.trim() || !biz.ownerName.trim()) {
      setBizErrors({
        businessName: !biz.businessName.trim(),
        ownerName: !biz.ownerName.trim(),
      });
      setError("Please fill in your business name and your name to continue.");
      return;
    }
    setBizErrors({ businessName: false, ownerName: false });
    setSaving(true);
    try {
      await supabaseUpdate({
        business_name: biz.businessName.trim() || null,
        owner_name: biz.ownerName.trim() || null,
        phone: biz.phone.trim() || null,
        min_price: parseFloat(biz.minPrice) || 75,
        target_margin: parseFloat(biz.targetMargin) || 40,
        onboarding_step: 2,
      });
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  async function handleLaborNext() {
    setSaving(true);
    try {
      await supabaseUpdate({
        labor_rate: parseFloat(labor.laborRate) || 25,
        default_crew_size: parseInt(labor.crewSize) || 2,
        default_travel_fee: parseFloat(labor.travelFee) || 15,
        onboarding_step: 3,
      });
      setStep(3);
    } catch {
      setStep(3);
    } finally {
      setSaving(false);
    }
  }

  async function handleTrucksNext() {
    setSaving(true);
    try {
      await supabaseUpdate({
        truckload_pricing: buildTruckPricing(),
        dump_fee_mode: dumpMode,
        dump_fee_per_ton: dumpMode === "per_ton" ? (parseFloat(dumpFeePerTon) || null) : null,
        flat_dump_fees: dumpMode === "flat_rate" ? buildDumpFees() : null,
        onboarding_step: 4,
        onboarded_at: new Date().toISOString(),
      });
      // Fire welcome email non-blocking — failure must not stall the user
      fetch("/api/emails/welcome", { method: "POST" }).catch(() => {});
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    try {
      await supabaseUpdate({
        business_name: biz.businessName.trim() || null,
        owner_name: biz.ownerName.trim() || null,
        phone: biz.phone.trim() || null,
        min_price: parseFloat(biz.minPrice) || 75,
        target_margin: parseFloat(biz.targetMargin) || 40,
        labor_rate: parseFloat(labor.laborRate) || 25,
        default_crew_size: parseInt(labor.crewSize) || 2,
        default_travel_fee: parseFloat(labor.travelFee) || 15,
        truckload_pricing: buildTruckPricing(),
        dump_fee_mode: dumpMode,
        dump_fee_per_ton: dumpMode === "per_ton" ? (parseFloat(dumpFeePerTon) || null) : null,
        flat_dump_fees: dumpMode === "flat_rate" ? buildDumpFees() : null,
        onboarding_step: 4,
        onboarded_at: new Date().toISOString(),
      });
      // Fire welcome email non-blocking — failure must not stall the user
      fetch("/api/emails/welcome", { method: "POST" }).catch(() => {});
    } catch {
      // non-fatal
    } finally {
      router.push("/dashboard");
    }
  }

  // ── Step 0 — Welcome ─────────────────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="min-h-dvh flex flex-col bg-qm-bg px-6 pt-[64px] pb-10 max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Logo */}
          <div className="mb-8 shadow-lg rounded-[22px]">
            <AppLogo size="xl" />
          </div>

          <h1 className="text-[32px] font-bold text-qm-text tracking-[-1px] leading-none">
            Welcome to QuoteMate
          </h1>
          <p className="text-[16px] text-qm-text-muted mt-4 leading-relaxed max-w-[300px]">
            Let&apos;s set up your pricing in 2 minutes so your quotes are accurate from day one.
          </p>

          {/* What we'll set up */}
          <div
            className="w-full mt-8 rounded-[18px] px-5 py-4 text-left flex flex-col gap-3"
            style={{
              background: "var(--color-qm-surface)",
              border: "1px solid var(--color-qm-border)",
            }}
          >
            {[
              "Business name & contact info",
              "Labor rates & crew size",
              "Truckload pricing per load size",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-qm-accent-soft)" }}
                >
                  <Check
                    size={11}
                    strokeWidth={3}
                    style={{ color: "var(--color-qm-accent-dark)" }}
                  />
                </div>
                <span className="text-[14px] font-medium text-qm-text">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-6">
          <button
            onClick={handleWelcomeNext}
            disabled={saving}
            className="w-full h-[56px] rounded-[16px] text-white text-[17px] font-semibold flex items-center justify-center gap-2"
            style={{
              background: "var(--color-qm-accent)",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "One moment…" : "Get started"}
            {!saving && <ArrowRight size={18} strokeWidth={2.3} />}
          </button>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-qm-text-muted disabled:opacity-40"
          >
            Skip setup, go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4 — All set ─────────────────────────────────────────────────────────

  if (step === 4) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-qm-bg px-6 pb-10 max-w-md mx-auto">
        <div className="w-full max-w-sm flex flex-col items-center text-center gap-0">
          {/* Check icon */}
          <div
            className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-6"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <Check
              size={36}
              strokeWidth={2.5}
              style={{ color: "var(--color-qm-accent)" }}
            />
          </div>

          <h1 className="text-[30px] font-bold text-qm-text tracking-[-0.8px] leading-tight">
            You&apos;re ready to quote
          </h1>
          <p className="text-[15px] text-qm-text-muted mt-3 leading-relaxed max-w-[280px]">
            Your pricing is saved. Create your first quote in under 60 seconds.
          </p>

          {/* Summary chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "Pricing saved",
              "Labor rates set",
              "Load sizes configured",
            ].map((chip) => (
              <div
                key={chip}
                className="flex items-center gap-1.5 rounded-full px-3 py-1"
                style={{
                  background: "var(--color-qm-accent-soft)",
                  border: "1px solid var(--color-qm-accent-soft)",
                }}
              >
                <Check
                  size={11}
                  strokeWidth={3}
                  style={{ color: "var(--color-qm-accent-dark)" }}
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--color-qm-accent-dark)" }}
                >
                  {chip}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/new-quote")}
            className="mt-10 w-full h-[56px] rounded-[16px] text-white text-[17px] font-semibold flex items-center justify-center gap-2"
            style={{ background: "var(--color-qm-accent)" }}
          >
            Create my first quote
            <ArrowRight size={18} strokeWidth={2.3} />
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-3 text-[14px] font-semibold text-qm-text-muted"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Steps 1–3 share a scrollable shell ──────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col bg-qm-bg max-w-md mx-auto">
      <ProgressHeader step={step as 1 | 2 | 3} onSkip={handleSkip} saving={saving} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pb-6">
        {step === 1 && (
          <StepBusiness
            biz={biz}
            setBiz={setBiz}
            errors={bizErrors}
            error={error}
          />
        )}
        {step === 2 && (
          <StepLabor labor={labor} setLabor={setLabor} />
        )}
        {step === 3 && (
          <StepTrucks
            truckPrices={truckPrices}
            setTruckPrices={setTruckPrices}
            dumpMode={dumpMode}
            setDumpMode={setDumpMode}
            dumpFeePerTon={dumpFeePerTon}
            setDumpFeePerTon={setDumpFeePerTon}
            dumpFees={dumpFees}
            setDumpFees={setDumpFees}
          />
        )}
      </div>

      {/* Sticky footer */}
      <div
        className="shrink-0 px-[22px] pt-4 pb-8"
        style={{ borderTop: "1px solid var(--color-qm-border)" }}
      >
        {error && step === 1 && (
          <div
            className="mb-3 text-[13px] font-medium text-center rounded-[12px] py-[10px] px-3"
            style={{
              background: "var(--color-qm-danger-soft)",
              color: "var(--color-qm-danger)",
            }}
          >
            {error}
          </div>
        )}
        <button
          onClick={
            step === 1
              ? handleBizNext
              : step === 2
              ? handleLaborNext
              : handleTrucksNext
          }
          disabled={saving}
          className="w-full h-[54px] rounded-[16px] text-white text-[17px] font-semibold"
          style={{
            background: "var(--color-qm-accent)",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : step === 3 ? "Finish setup" : "Continue"}
        </button>
      </div>
    </div>
  );
}

// ─── Step 1 — Business basics ─────────────────────────────────────────────────

function StepBusiness({
  biz,
  setBiz,
  errors,
  error,
}: {
  biz: { businessName: string; ownerName: string; phone: string; minPrice: string; targetMargin: string };
  setBiz: React.Dispatch<React.SetStateAction<typeof biz>>;
  errors: { businessName: boolean; ownerName: boolean };
  error: string | null;
}) {
  function set(key: keyof typeof biz) {
    return (v: string) => setBiz((b) => ({ ...b, [key]: v }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-[26px] font-bold text-qm-text tracking-[-0.6px] leading-tight">
          Business basics
        </h2>
        <p className="text-[14px] text-qm-text-muted mt-1.5 leading-relaxed">
          This shows on your quotes so customers know who they&apos;re working with.
        </p>
      </div>

      <Field
        label="Business name"
        value={biz.businessName}
        onChange={set("businessName")}
        placeholder="Mike's Junk Removal"
        required
        hasError={errors.businessName}
      />
      <Field
        label="Your name"
        value={biz.ownerName}
        onChange={set("ownerName")}
        placeholder="Mike Henderson"
        required
        hasError={errors.ownerName}
      />
      <Field
        label="Phone number"
        value={biz.phone}
        onChange={set("phone")}
        placeholder="(555) 123-4567"
        type="tel"
        optional
      />

      {/* Divider */}
      <div className="pt-1">
        <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.5px] mb-3">
          Pricing defaults
        </div>
        <div className="flex flex-col gap-4">
          <Field
            label="Minimum job price"
            value={biz.minPrice}
            onChange={set("minPrice")}
            placeholder="75"
            type="number"
            inputMode="numeric"
            prefix="$"
          />
          <Field
            label="Target margin"
            value={biz.targetMargin}
            onChange={set("targetMargin")}
            placeholder="40"
            type="number"
            inputMode="numeric"
            suffix="%"
          />
        </div>
      </div>

      <p className="text-[12px] text-qm-text-faint text-center leading-relaxed">
        You can update everything later in Settings.
      </p>
    </div>
  );
}

// ─── Step 2 — Labor costs ─────────────────────────────────────────────────────

function StepLabor({
  labor,
  setLabor,
}: {
  labor: { laborRate: string; crewSize: string; travelFee: string };
  setLabor: React.Dispatch<React.SetStateAction<typeof labor>>;
}) {
  function set(key: keyof typeof labor) {
    return (v: string) => setLabor((l) => ({ ...l, [key]: v }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-[26px] font-bold text-qm-text tracking-[-0.6px] leading-tight">
          Labor costs
        </h2>
        <p className="text-[14px] text-qm-text-muted mt-1.5 leading-relaxed">
          We use these to calculate your real cost on every quote.
        </p>
      </div>

      <Field
        label="Labor cost per person / hour"
        value={labor.laborRate}
        onChange={set("laborRate")}
        placeholder="25"
        type="number"
        inputMode="numeric"
        prefix="$"
        suffix="/ hr"
      />
      <Field
        label="Default crew size"
        value={labor.crewSize}
        onChange={set("crewSize")}
        placeholder="2"
        type="number"
        inputMode="numeric"
        suffix="people"
      />
      <Field
        label="Default travel / fuel fee"
        value={labor.travelFee}
        onChange={set("travelFee")}
        placeholder="15"
        type="number"
        inputMode="numeric"
        prefix="$"
      />

      {/* Tip */}
      <div
        className="rounded-[14px] px-4 py-3"
        style={{
          background: "var(--color-qm-surface)",
          border: "1px solid var(--color-qm-border)",
        }}
      >
        <p className="text-[13px] text-qm-text-muted leading-relaxed">
          <strong className="text-qm-text font-semibold">Tip:</strong> QuoteMate multiplies labor cost × crew size × estimated hours to calculate your total cost. You&apos;ll adjust hours per quote.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3 — Truckload pricing & disposal fees ───────────────────────────────

function StepTrucks({
  truckPrices,
  setTruckPrices,
  dumpMode,
  setDumpMode,
  dumpFeePerTon,
  setDumpFeePerTon,
  dumpFees,
  setDumpFees,
}: {
  truckPrices: Record<LoadId, string>;
  setTruckPrices: React.Dispatch<React.SetStateAction<Record<LoadId, string>>>;
  dumpMode: "per_ton" | "flat_rate";
  setDumpMode: React.Dispatch<React.SetStateAction<"per_ton" | "flat_rate">>;
  dumpFeePerTon: string;
  setDumpFeePerTon: React.Dispatch<React.SetStateAction<string>>;
  dumpFees: Record<LoadId, string>;
  setDumpFees: React.Dispatch<React.SetStateAction<Record<LoadId, string>>>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-1">
        <h2 className="text-[26px] font-bold text-qm-text tracking-[-0.6px] leading-tight">
          Pricing & disposal fees
        </h2>
        <p className="text-[14px] text-qm-text-muted mt-1.5 leading-relaxed">
          Set your base price for each load size, then choose how you calculate disposal.
        </p>
      </div>

      {/* ── Truck pricing table ─────────────────────────────────────────────── */}
      <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.5px] -mb-1">
        Truckload prices
      </div>
      <div
        className="rounded-[18px] overflow-hidden"
        style={{ border: "1px solid var(--color-qm-border)" }}
      >
        {/* Header */}
        <div
          className="grid grid-cols-[1fr_90px] gap-2 px-4 py-2"
          style={{ background: "var(--color-qm-surface-alt)", borderBottom: "1px solid var(--color-qm-border)" }}
        >
          <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.4px]">
            Load size
          </div>
          <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.4px] text-center">
            Price
          </div>
        </div>

        {/* Rows */}
        {LOAD_SIZES.map((size, i) => (
          <div
            key={size.id}
            className="grid grid-cols-[1fr_90px] gap-2 items-center px-4 py-[10px] bg-qm-surface"
            style={{ borderTop: i > 0 ? "1px solid var(--color-qm-border)" : undefined }}
          >
            <div>
              <div className="text-[13px] font-semibold text-qm-text leading-tight">
                {size.label}
              </div>
              <div className="text-[11px] text-qm-text-faint mt-[1px] truncate">
                {size.hint}
              </div>
            </div>
            <div
              className="flex items-center rounded-[9px] px-[8px] h-[36px]"
              style={{ border: "1px solid var(--color-qm-border)", background: "var(--color-qm-bg)" }}
            >
              <span className="text-qm-text-muted text-[13px] mr-0.5 shrink-0">$</span>
              <input
                type="number"
                inputMode="numeric"
                value={truckPrices[size.id]}
                onChange={(e) => setTruckPrices((p) => ({ ...p, [size.id]: e.target.value }))}
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-qm-text min-w-0 text-right"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Disposal / dump fee ─────────────────────────────────────────────── */}
      <div className="text-[11px] font-semibold text-qm-text-faint uppercase tracking-[0.5px] mt-1 -mb-1">
        Disposal / dump fee
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-[12px] bg-qm-surface border border-qm-border overflow-hidden">
        {(["per_ton", "flat_rate"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setDumpMode(mode)}
            className={`flex-1 py-[10px] text-[13px] font-semibold transition-colors ${
              dumpMode === mode ? "bg-qm-accent text-white" : "text-qm-text-muted"
            }`}
          >
            {mode === "per_ton" ? "Per ton" : "Flat rate"}
          </button>
        ))}
      </div>

      {dumpMode === "per_ton" ? (
        <div>
          <Field
            label="Dump fee per ton"
            value={dumpFeePerTon}
            onChange={setDumpFeePerTon}
            placeholder="75"
            type="number"
            inputMode="decimal"
            prefix="$"
            suffix="/ ton"
            optional
          />
          <p className="mt-[6px] text-[11.5px] text-qm-text-faint leading-snug px-1">
            Auto-calculates per load: min 0.1t · ⅛ 0.25t · ¼ 0.5t · ½ 1.0t · ¾ 1.5t · full 2.0t · multiple 4.0t
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[12px] text-qm-text-faint mb-2 px-1">
            Set a fixed disposal fee for each load size
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "min",      label: "Minimum" },
              { key: "eight",    label: "⅛ truck" },
              { key: "qtr",      label: "¼ truck" },
              { key: "half",     label: "½ truck" },
              { key: "three",    label: "¾ truck" },
              { key: "full",     label: "Full truck" },
              { key: "multiple", label: "Multiple" },
            ] as const).map(({ key, label }) => (
              <div key={key}>
                <div className="text-[12px] font-medium text-qm-text-muted mb-[6px]">
                  {label}
                </div>
                <div className="flex items-center bg-qm-surface border border-qm-border rounded-[12px] px-3 h-[46px]">
                  <span className="text-qm-text-muted text-[15px] font-medium mr-1 shrink-0">$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={dumpFees[key]}
                    onChange={(e) => setDumpFees((f) => ({ ...f, [key]: e.target.value }))}
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-qm-text min-w-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[12px] text-qm-text-faint text-center leading-relaxed">
        You can always update these later in Settings.
      </p>
    </div>
  );
}
