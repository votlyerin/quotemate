import { type ReactNode } from "react";

type Tone =
  | "excellent"
  | "good"
  | "risky"
  | "underpriced"
  | "neutral"
  | "accent"
  | "sent"
  | "draft"
  | "accepted"
  | "declined"
  | "expired";

type Size = "sm" | "md" | "lg";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  size?: Size;
}

const toneStyles: Record<Tone, string> = {
  excellent: "bg-qm-excellent-soft text-qm-excellent",
  good: "bg-qm-good-soft text-qm-good",
  risky: "bg-qm-warn-soft text-qm-warn",
  underpriced: "bg-qm-danger-soft text-qm-danger",
  neutral: "bg-qm-surface-alt text-qm-text-muted",
  accent: "bg-qm-accent-soft text-qm-accent",
  sent: "bg-qm-accent-soft text-qm-accent-dark",
  draft: "bg-qm-surface-alt text-qm-text-muted",
  accepted: "bg-qm-good-soft text-qm-good",
  declined: "bg-qm-danger-soft text-qm-danger",
  expired: "bg-qm-surface-alt text-qm-text-faint",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-5 px-[7px] text-[11px] rounded-[6px]",
  md: "h-6 px-[9px] text-[12px] rounded-[7px]",
  lg: "h-[30px] px-[11px] text-[13px] rounded-[9px]",
};

export function Badge({ children, tone = "neutral", size = "md" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold whitespace-nowrap
        ${toneStyles[tone]}
        ${sizeStyles[size]}
      `}
    >
      {children}
    </span>
  );
}
