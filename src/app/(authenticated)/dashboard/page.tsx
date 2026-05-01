import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "./DashboardContent";
import type { Profile, Quote } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: monthQuotes } = await supabase
    .from("quotes")
    .select("final_price, status, profit, margin_pct, margin_status")
    .eq("user_id", user!.id)
    .gte("created_at", startOfMonth);

  const { data: recentQuotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const quotes = monthQuotes ?? [];
  const stats = {
    month: quotes.length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    avgValue: Math.round(
      quotes.reduce((s, q) => s + (q.final_price || 0), 0) /
        Math.max(quotes.length, 1)
    ),
    profit: Math.round(
      quotes.reduce((s, q) => s + (q.profit || 0), 0)
    ),
  };

  return (
    <DashboardContent
      profile={(profile as Profile) ?? null}
      stats={stats}
      recentQuotes={(recentQuotes as Quote[]) ?? []}
    />
  );
}
