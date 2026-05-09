import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function Home() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        redirect("/dashboard");
      }
    } catch {
      // Supabase unreachable
    }
  }

  redirect("/login");
}
