"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Truck, Info } from "lucide-react";
import type { Profile, TruckloadPricing } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "welcome" | "business" | "pricing" | "truck";

interface OnboardData {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  serviceArea: string;
  minPrice: string;
  targetMargin: string;
  laborRate: string;
  crewSize: string;
  travelFee: string;
  expiryDays: string;
  truckMin: string;
  truckEight: string;
  truckQtr: string;
  truckHalf: string;
  truckThree: string;
  truckFull: string;
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-[6px] px-[22px] pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1 rounded-full transition-all duration-200"
          style={{
            width: i === current ? 24 : 8,
            background:
              i <= current
                ? "var(--color-qm-accent)"
                : "var(--color-qm-border)",
          }}
        />
      ))}
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

function TruckRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-qm-surface border border-qm-border rounded-2xl px-[14px] py-3">
      <div
        className="w-11 h-11 rounded-[11px] flex items-center justify-center shrink-0"
        style={{ background: "var(--color-qm-surface-alt)" }}
      >
        <Truck size={20} className="text-qm-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold text-qm-text">{label}</div>
        <div className="text-[12px] text-qm-text-muted mt-[1px] truncate">
          {sub}
        </div>
      </div>
      <div
        className="flex items-center rounded-[10px] px-[10px] shrink-0"
        style={{
          background: "var(--color-qm-surface-alt)",
          width: 96,
        }}
      >
        <span className="text-qm-text-muted text-[15px] font-medium mr-0.5">
          $
        </span>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[17px] font-semibold text-qm-text min-w-0 py-[10px] text-right"
        />
      </div>
    </div>
  );
}

// ─── Step shells ──────────────────────────────────────────────────────────────

function OnboardShell({
  stepIndex,
  title,
  subtitle,
  onBack,
  onSkip,
  cta,
  onCta,
  ctaLoading,
  children,
}: {
  stepIndex: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onSkip: () => void;
  cta: string;
  onCta: () => void;
  ctaLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-qm-bg">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-[22px] pt-[56px] pb-3 shrink-0">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full active:bg-qm-border"
        >
          <ChevronLeft size={22} className="text-qm-text" strokeWidth={2} />
        </button>
        <div className="flex-1 text-center text-[15px] font-semibold text-qm-text">
          Setup {stepIndex + 1} of 3
        </div>
        <button
          onClick={onSkip}
          className="text-[14px] font-semibold text-qm-text-muted px-2"
        >
          Skip
        </button>
      </div>

      {/* Step dots */}
      <StepDots current={stepIndex} total={3} />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-[22px] pt-6 pb-4">
        <div className="text-[26px] font-bold text-qm-text tracking-[-0.6px] leading-[1.15]">
          {title}
        </div>
        {subtitle && (
          <div className="text-[14px] text-qm-text-muted mt-2 leading-relaxed">
            {subtitle}
          </div>
        )}
        <div className="mt-6 flex flex-col gap-4">{children}</div>
      </div>

      {/* Sticky footer */}
      <div
        className="px-[22px] pt-3 pb-8 shrink-0"
        style={{ borderTop: "1px solid var(--color-qm-border)" }}
      >
        <button
          onClick={onCta}
          disabled={ctaLoading}
          className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold"
          style={{ opacity: ctaLoading ? 0.7 : 1 }}
        >
          {ctaLoading ? "Saving…" : cta}
        </button>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="min-h-dvh flex flex-col bg-qm-bg px-6 pt-[60px] pb-10">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-0">
        {/* Logo */}
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mb-7 shadow-lg"
          style={{ background: "var(--color-qm-accent)" }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
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

        <div className="text-[38px] font-bold text-qm-text tracking-[-1.2px] leading-none">
          QuoteMate
        </div>

        <div className="mt-5 text-[19px] font-medium text-qm-text leading-[1.35] tracking-[-0.4px]">
          Quote jobs faster.
          <br />
          Price them smarter.
          <br />
          <span style={{ color: "var(--color-qm-accent)" }}>
            Protect your profit.
          </span>
        </div>

        <div className="mt-4 text-[14px] text-qm-text-muted leading-relaxed max-w-[280px]">
          A mobile quote calculator built for junk removal businesses.
        </div>

        {/* Preview chip */}
        <div
          className="mt-8 flex items-center gap-4 w-full max-w-[320px] rounded-2xl px-[18px] py-[14px]"
          style={{
            background: "var(--color-qm-surface)",
            border: "1px solid var(--color-qm-border)",
          }}
        >
          <div
            className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: "var(--color-qm-accent-soft)" }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--color-qm-accent)" }}
            >
              <path d="M12 3v18M16 7c0-1.5-1.5-3-4-3s-4 1.5-4 3 1.5 3 4 3 4 1.5 4 3-1.5 3-4 3-4-1.5-4-3" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[14px] font-semibold text-qm-text">
              Recommended quote
            </div>
            <div className="text-[12px] text-qm-text-muted mt-[2px]">
              46% margin · Good profit
            </div>
          </div>
          <div className="text-[22px] font-bold text-qm-text tracking-[-0.5px]">
            $425
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3 pt-6">
        <button
          onClick={onNext}
          className="w-full h-14 rounded-[16px] bg-qm-accent text-white text-[17px] font-semibold"
        >
          Get started →
        </button>
        <button
          onClick={onSkip}
          className="w-full h-12 rounded-[14px] text-[15px] font-semibold text-qm-text-muted"
        >
          Skip setup
        </button>
      </div>
    </div>
  );
}

function BusinessStep({
  data,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  data: OnboardData;
  onChange: (k: keyof OnboardData, v: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <OnboardShell
      stepIndex={0}
      title="Tell us about your business"
      subtitle="This shows up on your quotes so customers know who they're working with."
      onBack={onBack}
      onSkip={onSkip}
      cta="Continue"
      onCta={onNext}
    >
      <Field
        label="Business name"
        value={data.businessName}
        onChange={(v) => onChange("businessName", v)}
        placeholder="Mike's Junk Removal"
        optional
      />
      <Field
        label="Owner name"
        value={data.ownerName}
        onChange={(v) => onChange("ownerName", v)}
        placeholder="Mike Henderson"
        optional
      />
      <Field
        label="Business phone"
        value={data.phone}
        onChange={(v) => onChange("phone", v)}
        placeholder="(555) 123-4567"
        type="tel"
        optional
      />
      <Field
        label="Business email"
        value={data.email}
        onChange={(v) => onChange("email", v)}
        placeholder="hello@mikesjunk.com"
        type="email"
        optional
      />
      <Field
        label="Service area"
        value={data.serviceArea}
        onChange={(v) => onChange("serviceArea", v)}
        placeholder="Greater Austin, TX"
        optional
      />
    </OnboardShell>
  );
}

function PricingStep({
  data,
  onChange,
  onBack,
  onSkip,
  onNext,
}: {
  data: OnboardData;
  onChange: (k: keyof OnboardData, v: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  return (
    <OnboardShell
      stepIndex={1}
      title="Set your pricing defaults"
      subtitle="We use these to calculate profit on every quote. You can change them anytime in Settings."
      onBack={onBack}
      onSkip={onSkip}
      cta="Continue"
      onCta={onNext}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Min price"
          value={data.minPrice}
          onChange={(v) => onChange("minPrice", v)}
          placeholder="125"
          type="number"
          inputMode="numeric"
          prefix="$"
        />
        <Field
          label="Target margin"
          value={data.targetMargin}
          onChange={(v) => onChange("targetMargin", v)}
          placeholder="45"
          type="number"
          inputMode="numeric"
          suffix="%"
        />
        <Field
          label="Labor rate"
          value={data.laborRate}
          onChange={(v) => onChange("laborRate", v)}
          placeholder="35"
          type="number"
          inputMode="numeric"
          prefix="$"
          suffix="/hr"
        />
        <Field
          label="Crew size"
          value={data.crewSize}
          onChange={(v) => onChange("crewSize", v)}
          placeholder="2"
          type="number"
          inputMode="numeric"
          suffix="ppl"
        />
        <Field
          label="Travel fee"
          value={data.travelFee}
          onChange={(v) => onChange("travelFee", v)}
          placeholder="25"
          type="number"
          inputMode="numeric"
          prefix="$"
        />
        <Field
          label="Quote expiry"
          value={data.expiryDays}
          onChange={(v) => onChange("expiryDays", v)}
          placeholder="7"
          type="number"
          inputMode="numeric"
          suffix="days"
        />
      </div>

      {/* Info tip */}
      <div
        className="flex items-start gap-3 rounded-[14px] px-4 py-3"
        style={{
          background: "var(--color-qm-accent-soft)",
          border: "1px solid var(--color-qm-accent-soft)",
        }}
      >
        <Info
          size={17}
          className="shrink-0 mt-[1px]"
          style={{ color: "var(--color-qm-accent-dark)" }}
        />
        <div
          className="text-[13px] leading-relaxed"
          style={{ color: "var(--color-qm-accent-dark)" }}
        >
          We&apos;ll warn you any time a quote falls below your target margin.
        </div>
      </div>
    </OnboardShell>
  );
}

const TRUCK_TIERS = [
  { key: "truckMin" as const, label: "Minimum pickup", sub: "A few small items" },
  { key: "truckEight" as const, label: "1/8 truck", sub: "Small load · 1–2 items" },
  { key: "truckQtr" as const, label: "1/4 truck", sub: "Couch, mattress + extras" },
  { key: "truckHalf" as const, label: "1/2 truck", sub: "Small room cleanout" },
  { key: "truckThree" as const, label: "3/4 truck", sub: "Garage / large room" },
  { key: "truckFull" as const, label: "Full truck", sub: "Full clean-out" },
];

function TruckStep({
  data,
  onChange,
  onBack,
  onSkip,
  onFinish,
  saving,
}: {
  data: OnboardData;
  onChange: (k: keyof OnboardData, v: string) => void;
  onBack: () => void;
  onSkip: () => void;
  onFinish: () => void;
  saving: boolean;
}) {
  return (
    <OnboardShell
      stepIndex={2}
      title="Truckload pricing"
      subtitle="Set your base price for each load size. We'll suggest these on every quote."
      onBack={onBack}
      onSkip={onSkip}
      cta="Finish setup"
      onCta={onFinish}
      ctaLoading={saving}
    >
      <div className="flex flex-col gap-[10px]">
        {TRUCK_TIERS.map((tier) => (
          <TruckRow
            key={tier.key}
            label={tier.label}
            sub={tier.sub}
            value={data[tier.key]}
            onChange={(v) => onChange(tier.key, v)}
          />
        ))}
      </div>
    </OnboardShell>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OnboardingFlow({
  profile,
  userId,
}: {
  profile: Partial<Profile>;
  userId: string;
}) {
  const router = useRouter();
  const tp = profile.truckload_pricing;

  const [step, setStep] = useState<Step>("welcome");
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardData>({
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
    truckMin: String(tp?.min ?? 95),
    truckEight: String(tp?.eight ?? 145),
    truckQtr: String(tp?.qtr ?? 225),
    truckHalf: String(tp?.half ?? 325),
    truckThree: String(tp?.three ?? 475),
    truckFull: String(tp?.full ?? 625),
  });

  function set(key: keyof OnboardData, value: string) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function skipToDashboard() {
    router.push("/dashboard");
  }

  async function handleFinish() {
    setSaving(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase
        .from("profiles")
        .update({
          business_name: data.businessName || null,
          owner_name: data.ownerName || null,
          phone: data.phone || null,
          email: data.email || null,
          service_area: data.serviceArea || null,
          min_price: parseFloat(data.minPrice) || 125,
          target_margin: parseFloat(data.targetMargin) || 45,
          labor_rate: parseFloat(data.laborRate) || 35,
          default_crew_size: parseInt(data.crewSize) || 2,
          default_travel_fee: parseFloat(data.travelFee) || 25,
          quote_expiry_days: parseInt(data.expiryDays) || 7,
          truckload_pricing: {
            min: parseFloat(data.truckMin) || 95,
            eight: parseFloat(data.truckEight) || 145,
            qtr: parseFloat(data.truckQtr) || 225,
            half: parseFloat(data.truckHalf) || 325,
            three: parseFloat(data.truckThree) || 475,
            full: parseFloat(data.truckFull) || 625,
          } as TruckloadPricing,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch {
      // Non-fatal — still proceed to dashboard
    } finally {
      router.push("/dashboard");
    }
  }

  if (step === "welcome") {
    return (
      <WelcomeStep
        onNext={() => setStep("business")}
        onSkip={skipToDashboard}
      />
    );
  }

  if (step === "business") {
    return (
      <BusinessStep
        data={data}
        onChange={set}
        onBack={() => setStep("welcome")}
        onSkip={skipToDashboard}
        onNext={() => setStep("pricing")}
      />
    );
  }

  if (step === "pricing") {
    return (
      <PricingStep
        data={data}
        onChange={set}
        onBack={() => setStep("business")}
        onSkip={skipToDashboard}
        onNext={() => setStep("truck")}
      />
    );
  }

  return (
    <TruckStep
      data={data}
      onChange={set}
      onBack={() => setStep("pricing")}
      onSkip={skipToDashboard}
      onFinish={handleFinish}
      saving={saving}
    />
  );
}
