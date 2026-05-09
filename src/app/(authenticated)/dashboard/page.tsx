import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";
import type { Profile, Quote } from "@/types/database";
import { getTier } from "@/lib/tier";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  let profile: Profile | null = null;
  let recentQuotes: Quote[] = [];
  const stats = { month: 0, accepted: 0, avgValue: 0, profit: 0 };
  let monthlyQuoteCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        profile = profileData as Profile;

        // If owner_name is blank, fall back to signup metadata
        if (profile && !profile.owner_name && user.user_metadata?.full_name) {
          profile = { ...profile, owner_name: user.user_metadata.full_name as string };
        }

        const now = new Date();
        const startOfMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();

        const [{ data: monthQuotes }, { data: recentData }] = await Promise.all([
          supabase
            .from("quotes")
            .select("final_price, status, profit, margin_pct, margin_status")
            .eq("user_id", user.id)
            .gte("created_at", startOfMonth),
          supabase
            .from("quotes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        recentQuotes = (recentData as Quote[]) ?? [];

        const quotes = monthQuotes ?? [];
        monthlyQuoteCount = quotes.length;
        stats.month = quotes.length;
        stats.accepted = quotes.filter((q) => q.status === "accepted").length;
        stats.avgValue = Math.round(
          quotes.reduce((s, q) => s + (q.final_price || 0), 0) /
            Math.max(quotes.length, 1)
        );
        stats.profit = Math.round(
          quotes.reduce((s, q) => s + (q.profit || 0), 0)
        );
      }
    } catch {
      // Supabase unavailable — show empty dashboard
    }
  }

  const tier = getTier(profile);

  return (
    <DashboardContent
      profile={profile}
      stats={stats}
      recentQuotes={recentQuotes}
      tier={tier}
      monthlyQuoteCount={monthlyQuoteCount}
      checkoutSuccess={checkout === "success"}
    />
  );
}
