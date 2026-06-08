import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { Profile, Quote } from "@/types/database";
import type { PricingConfig, TruckPricing } from "@/lib/quote-calc";
import { getTier } from "@/lib/tier";
import { NewQuoteFlow } from "@/app/(authenticated)/new-quote/NewQuoteFlow";

const DEFAULT_TRUCK: TruckPricing = {
  min: 95, eight: 145, qtr: 225, half: 325,
  three: 475, full: 625, multiple: 850,
};

const DEFAULT_PRICING: PricingConfig = {
  margin: 45, labor: 35, crew: 2, travel: 25, minPrice: 125,
  complexityFees: { stairs: 25, basement: 25, longCarry: 25, heavy: 25, rush: 50 },
};

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch quote — must belong to this user and be a draft
  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!quote) notFound();
  if (quote.status !== "draft") redirect(`/quotes/${id}`);

  // Fetch profile for pricing config
  let pricing = DEFAULT_PRICING;
  let truck = DEFAULT_TRUCK;
  let profile: Profile | null = null;
  let monthlyQuoteCount = 0;

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileData) {
    profile = profileData as Profile;
    pricing = {
      margin: profile.target_margin,
      labor: profile.labor_rate,
      crew: profile.default_crew_size,
      travel: profile.default_travel_fee,
      minPrice: profile.min_price,
      complexityFees: profile.complexity_fees as Record<string, number>,
      dumpFeePerTon: profile.dump_fee_per_ton ?? undefined,
      dumpFeeMode: (profile.dump_fee_mode ?? "per_ton") as "per_ton" | "flat_rate",
      flatDumpFees: profile.flat_dump_fees as Record<string, number> | undefined,
    };
    truck = profile.truckload_pricing;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", monthStart);
  monthlyQuoteCount = count ?? 0;

  const tier = getTier(profile);

  return (
    <NewQuoteFlow
      pricing={pricing}
      truck={truck}
      userId={user.id}
      profile={profile}
      tier={tier}
      monthlyQuoteCount={monthlyQuoteCount}
      editQuoteId={id}
      initialQuote={quote as Quote}
    />
  );
}
