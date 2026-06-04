"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

interface Props {
  userId: string;
  email: string | null | undefined;
  plan: string;
}

/**
 * Identifies the current user in PostHog on every authenticated page load.
 * Renders nothing — included once in the authenticated layout.
 */
export function PostHogIdentify({ userId, email, plan }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    posthog.identify(userId, {
      email: email ?? undefined,
      plan,
    });
  }, [userId, email, plan]);

  return null;
}
