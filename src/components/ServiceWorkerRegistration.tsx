"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker on the client.
 * Renders nothing — included once in the root layout.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.debug("[SW] registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] registration failed:", err);
        });
    }
  }, []);

  return null;
}
