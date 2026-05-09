import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { OnboardingFlow } from "./OnboardingFlow";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function OnboardingPage() {
  let profile: Partial<Profile> = {};
  let userId = "dev-user";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) redirect("/login");

      userId = user.id;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        profile = data as Profile;
        // Already onboarded — skip straight to dashboard
        if (profile.business_name) redirect("/dashboard");
      }
    } catch {
      redirect("/login");
    }
  }

  return <OnboardingFlow profile={profile} userId={userId} />;
}
