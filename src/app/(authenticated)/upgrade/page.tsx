import { createClient } from "@/lib/supabase/server";
import { getTier } from "@/lib/tier";
import { UpgradePageContent } from "./UpgradePageContent";
import type { Profile } from "@/types/database";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function UpgradePage() {
  let profile: Profile | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        profile = data as Profile;
      }
    } catch {
      // use defaults
    }
  }

  const tier = getTier(profile);

  return <UpgradePageContent tier={tier} />;
}
