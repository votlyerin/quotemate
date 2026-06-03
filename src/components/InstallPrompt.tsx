"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISSED_KEY = "qm_install_dismissed";

export function InstallPrompt() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone display mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Don't show if user dismissed recently (30-day cooldown)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const daysSince =
        (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setPromptEvent(null);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-[100px] left-0 right-0 z-50 flex justify-center px-4 animate-[qmSlideUp_0.25s_ease-out]"
    >
      <div
        className="w-full max-w-md rounded-[18px] px-[18px] py-[14px] flex items-center gap-3 shadow-xl"
        style={{
          background: "var(--color-qm-surface)",
          border: "1px solid var(--color-qm-border-strong)",
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: "var(--color-qm-accent-soft)" }}
        >
          <Download size={18} style={{ color: "var(--color-qm-accent)" }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-qm-text leading-tight">
            Add to Home Screen
          </div>
          <div className="text-[12px] text-qm-text-muted mt-[2px]">
            Quote faster — works offline too
          </div>
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          className="shrink-0 h-9 px-4 rounded-[10px] text-[13px] font-bold text-white"
          style={{ background: "var(--color-qm-accent)" }}
        >
          Install
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 -mr-1 rounded-full"
          aria-label="Dismiss"
        >
          <X size={16} className="text-qm-text-muted" />
        </button>
      </div>
    </div>
  );
}

// Extend the Window event map for TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
