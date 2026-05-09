import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Quote, Profile } from "@/types/database";
import { getTier } from "@/lib/tier";
import { QuoteDetail } from "./QuoteDetail";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url && !url.includes("your-project");
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    notFound();
  }

  let quote: Quote | null = null;
  let profile: Profile | null = null;
  let userId: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) notFound();
    userId = user.id;

    const [{ data: quoteData }, { data: profileData }] = await Promise.all([
      supabase
        .from("quotes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    if (!quoteData) notFound();
    quote = quoteData as Quote;
    profile = profileData as Profile;
  } catch {
    notFound();
  }

  const tier = getTier(profile);

  return (
    <QuoteDetail
      quote={quote!}
      profile={profile}
      userId={userId!}
      tier={tier}
    />
  );
}
