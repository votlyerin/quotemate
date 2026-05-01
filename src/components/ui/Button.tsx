"use client";

import { type ReactNode, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
  children?: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-qm-accent text-white border-transparent",
  secondary: "bg-qm-surface text-qm-text border-qm-border-strong",
  ghost: "bg-transparent text-qm-text border-transparent",
  danger: "bg-qm-danger-soft text-qm-danger border-transparent",
  dark: "bg-qm-text text-qm-bg border-transparent",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-[10px] gap-1.5",
  md: "h-[46px] px-[18px] text-[15px] rounded-[14px] gap-2",
  lg: "h-14 px-[22px] text-[17px] rounded-[16px] gap-2.5",
};

export function Button({
  variant = "primary",
  size = "lg",
  icon,
  full = true,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold tracking-tight border
        transition-[transform,opacity] duration-75 active:scale-[0.985]
        disabled:opacity-45 disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${full ? "w-full" : "w-auto"}
        ${className}
      `}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
