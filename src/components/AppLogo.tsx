// src/components/AppLogo.tsx
// Shared QuoteMate logo mark — green rounded square with bold white "Q".
// Import this everywhere instead of duplicating inline logo divs.

type Size = "sm" | "md" | "lg" | "xl";

const config: Record<Size, { box: string; text: string }> = {
  sm: { box: "w-9 h-9 rounded-[10px]",    text: "text-[22px]" },
  md: { box: "w-10 h-10 rounded-[11px]",   text: "text-[25px]" },
  lg: { box: "w-14 h-14 rounded-[14px]",   text: "text-[35px]" },
  xl: { box: "w-[72px] h-[72px] rounded-[22px]", text: "text-[45px]" },
};

export function AppLogo({ size = "md" }: { size?: Size }) {
  const { box, text } = config[size];
  return (
    <div className={`${box} bg-qm-accent flex items-center justify-center shrink-0`}>
      <span className={`${text} font-bold text-white leading-none select-none`}>Q</span>
    </div>
  );
}
