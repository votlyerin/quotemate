import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { SettingsForm } from "./SettingsForm";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function SettingsPage() {
  let profile: Partial<Profile> = {};
  let userId = "dev-user";
  let userEmail: string | undefined;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userId = user.id;
        userEmail = user.email ?? undefined;
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) profile = data as Profile;
      }
    } catch {
      // use defaults
    }
  }

  return (
    <SettingsForm profile={profile} userId={userId} userEmail={userEmail} />
  );
}
