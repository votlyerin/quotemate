import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: "sm" | "md" | "lg";
}

const paddingMap = {
  sm: "p-3.5",
  md: "p-[18px]",
  lg: "p-5",
};

export function Card({
  children,
  className = "",
  onClick,
  padding = "md",
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-qm-surface border border-qm-border rounded-[18px]
        ${paddingMap[padding]}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
