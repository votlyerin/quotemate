"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, List, Plus, Settings } from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Home", icon: Home, href: "/dashboard" },
  { id: "quotes", label: "Quotes", icon: List, href: "/quotes" },
  { id: "new", label: "New", icon: Plus, href: "/new-quote", primary: true },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveId = () => {
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/quotes")) return "quotes";
    if (pathname.startsWith("/new-quote")) return "new";
    if (pathname.startsWith("/settings")) return "settings";
    return "dashboard";
  };

  const activeId = getActiveId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-qm-surface border-t border-qm-border pt-2 pb-[30px] px-2">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const active = activeId === item.id;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.href)}
                className="flex flex-col items-center gap-1 py-0"
              >
                <div className="w-[46px] h-9 rounded-xl bg-qm-accent flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.25)]">
                  <Icon size={22} color="#fff" strokeWidth={2.2} />
                </div>
                <span className="text-[10.5px] font-semibold text-qm-text">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-[3px] py-1.5"
            >
              <Icon
                size={22}
                className={active ? "text-qm-accent" : "text-qm-text-faint"}
                strokeWidth={active ? 2 : 1.7}
              />
              <span
                className={`text-[10.5px] ${
                  active
                    ? "font-semibold text-qm-accent"
                    : "font-medium text-qm-text-faint"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
