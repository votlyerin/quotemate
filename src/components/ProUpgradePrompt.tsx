"use client";

import { Zap, X, Check } from "lucide-react";
import posthog from "posthog-js";

interface ProUpgradePromptProps {
  title?: string;
  body?: string;
  onClose: () => void;
}

const PRO_FEATURES = [
  "Unlimited quotes per month",
  "Full quote history",
  "Full line-item cost breakdown",
  "Send via email or link",
  "Quote status tracking",
  "Editable complexity surcharges",
];

export function ProUpgradePrompt({
  title = "Unlock QuoteMate Pro",
  body,
  onClose,
}: ProUpgradePromptProps) {
  const defaultBody = "Unlock all Pro features for $19/month — cancel any time.";
  function handleUpgrade() {
    posthog.capture("upgrade_clicked", { source: "prompt" });
    window.location.href =
      process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK!;
  }

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div className="flex-1" />
      <div
        className="bg-qm-surface rounded-t-[24px] px-[22px] pt-[18px] pb-[32px] animate-[qmSlideUp_0.22s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between mb-[18px]">
          <div className="w-9 h-1 rounded-full bg-qm-border-strong" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-qm-surface-alt text-qm-text-muted"
          >
            <X size={16} />
          </button>
        </div>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-[14px]"
          style={{ background: "var(--color-qm-accent-soft)" }}
        >
          <Zap
            size={22}
            style={{ color: "var(--color-qm-accent)" }}
            strokeWidth={2.3}
          />
        </div>

        {/* Heading */}
        <div className="text-[20px] font-bold text-qm-text tracking-[-0.4px]">
          {title}
        </div>
        <div className="mt-2 text-[14px] text-qm-text-muted leading-[1.45]">
          {body ?? defaultBody}
        </div>

        {/* Feature list */}
        <div className="mt-[16px] flex flex-col gap-[8px]">
          {PRO_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-[10px]">
              <div
                className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--color-qm-accent-soft)" }}
              >
                <Check
                  size={11}
                  style={{ color: "var(--color-qm-accent)" }}
                  strokeWidth={2.8}
                />
              </div>
              <span className="text-[13px] text-qm-text">{f}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          className="mt-[18px] w-full h-[52px] rounded-[16px] flex items-center justify-center gap-2 text-[16px] font-semibold text-white"
          style={{ background: "var(--color-qm-accent)" }}
        >
          <Zap size={16} strokeWidth={2.3} />
          Unlock Pro — $19/month
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full h-[44px] text-[14px] font-medium text-qm-text-muted"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
