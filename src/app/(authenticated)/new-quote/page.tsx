import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import type { PricingConfig, TruckPricing } from "@/lib/quote-calc";
import { getTier } from "@/lib/tier";
import { NewQuoteFlow } from "./NewQuoteFlow";

const DEFAULT_TRUCK: TruckPricing = {
  min: 95,
  eight: 145,
  qtr: 225,
  half: 325,
  three: 475,
  full: 625,
  multiple: 850,
};

const DEFAULT_PRICING: PricingConfig = {
  margin: 45,
  labor: 35,
  crew: 2,
  travel: 25,
  minPrice: 125,
  complexityFees: { stairs: 25, basement: 25, longCarry: 25, heavy: 25, rush: 50 },
};

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function NewQuotePage() {
  let pricing = DEFAULT_PRICING;
  let truck = DEFAULT_TRUCK;
  let userId: string | null = null;
  let profile: Profile | null = null;
  let monthlyQuoteCount = 0;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          profile = data as Profile;
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

        // Count quotes created this calendar month
        const now = new Date();
        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        const { count } = await supabase
          .from("quotes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", monthStart);
        monthlyQuoteCount = count ?? 0;
      }
    } catch {
      // use defaults
    }
  }

  const tier = getTier(profile);

  return (
    <NewQuoteFlow
      pricing={pricing}
      truck={truck}
      userId={userId}
      profile={profile}
      tier={tier}
      monthlyQuoteCount={monthlyQuoteCount}
    />
  );
}
