import type { Quote } from "@/types/database";

/**
 * Returns the display status of a quote.
 * If the quote is still "draft" or "sent" but the expiry date has passed,
 * it's treated as "expired" at display time without a DB write.
 */
export function effectiveStatus(quote: {
  status: Quote["status"];
  expires_at: string | null;
}): Quote["status"] {
  if (
    (quote.status === "draft" || quote.status === "sent") &&
    quote.expires_at &&
    new Date(quote.expires_at).getTime() < Date.now()
  ) {
    return "expired";
  }
  return quote.status;
}
