import { createClient } from "@/lib/supabase/server";
import type { Quote, Profile } from "@/types/database";
import { getTier } from "@/lib/tier";
import { QuotesList } from "./QuotesList";

const FREE_HISTORY_LIMIT = 5;

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function QuotesPage() {
  let quotes: Quote[] = [];
  let total = 0;
  let tier: "free" | "pro" = "free";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select(
            "subscription_status, trial_ends_at, stripe_customer_id, has_used_trial"
          )
          .eq("id", user.id)
          .single();

        tier = getTier(profile as Partial<Profile> | null);

        const { data, count } = await supabase
          .from("quotes")
          .select("*", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          // Free tier: fetch only 5; Pro: fetch all
          .limit(tier === "pro" ? 1000 : FREE_HISTORY_LIMIT);

        quotes = (data as Quote[]) ?? [];
        total = count ?? 0;
      }
    } catch {
      // show empty list
    }
  }

  const hasUsedTrial = (profile as { has_used_trial?: boolean } | null)?.has_used_trial ?? false;

  return (
    <QuotesList
      quotes={quotes}
      total={total}
      tier={tier}
      freeHistoryLimit={FREE_HISTORY_LIMIT}
      hasUsedTrial={hasUsedTrial}
    />
  );
}
