import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { checkAdminAuth } from "./auth";
import { adminLogout } from "./actions";
import { getEffectiveSubStatus } from "@/lib/subscription";

// ── Supabase admin client (service role — bypasses RLS) ──────────────────────

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function planLabel(status: string | null | undefined): string {
  switch (status) {
    case "active":       return "Pro";
    case "trialing":     return "Trialing";
    case "trial_ending": return "Trial Ending";
    case "past_due":     return "Past Due";
    default:             return "Free";
  }
}

function planColor(label: string): string {
  switch (label) {
    case "Pro":          return "text-emerald-400";
    case "Trialing":
    case "Trial Ending": return "text-yellow-400";
    case "Past Due":     return "text-red-400";
    default:             return "text-gray-400";
  }
}

function fmt(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const authed = await checkAdminAuth();
  if (!authed) redirect("/admin/login");

  const supabase = getAdminSupabase();

  // 1. All auth users (up to 1 000 — paginate later if needed)
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  if (authError) throw new Error(`Auth users fetch failed: ${authError.message}`);
  const authUsers = authData.users ?? [];

  // 2. All profiles
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, subscription_status, trial_ends_at, onboarded_at, created_at");
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // 3. Quote stats per user
  const { data: quotes } = await supabase
    .from("quotes")
    .select("user_id, status, created_at");

  type QuoteStats = { total: number; sent: number; lastActive: string | null };
  const quoteStats = new Map<string, QuoteStats>();

  for (const q of quotes ?? []) {
    const cur = quoteStats.get(q.user_id) ?? { total: 0, sent: 0, lastActive: null };
    cur.total += 1;
    // "sent" = ever dispatched to customer (sent / accepted / declined)
    if (["sent", "accepted", "declined"].includes(q.status)) cur.sent += 1;
    if (!cur.lastActive || q.created_at > cur.lastActive) cur.lastActive = q.created_at;
    quoteStats.set(q.user_id, cur);
  }

  // 4. Build rows, sort by signup date desc
  const rows = authUsers
    .map((u) => {
      const profile = profileMap.get(u.id);
      const stats   = quoteStats.get(u.id) ?? { total: 0, sent: 0, lastActive: null };
      const effectiveStatus = profile
        ? getEffectiveSubStatus(profile)
        : "expired";
      return {
        id:          u.id,
        email:       u.email ?? "—",
        plan:        planLabel(effectiveStatus),
        signedUp:    u.created_at,
        lastActive:  stats.lastActive,
        total:       stats.total,
        sent:        stats.sent,
        onboarded:   !!profile?.onboarded_at,
      };
    })
    .sort((a, b) => new Date(b.signedUp).getTime() - new Date(a.signedUp).getTime());

  return (
    <div className="min-h-screen bg-[#0E1414] text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-lg font-bold tracking-tight">QuoteMate Admin</span>
          <span className="ml-3 text-sm text-gray-400">{rows.length} users</span>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-6 py-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap">Email</th>
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap">Plan</th>
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap">Signed Up</th>
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap">Last Active</th>
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap text-right">Quotes</th>
              <th className="pb-3 pr-6 font-semibold whitespace-nowrap text-right">Sent</th>
              <th className="pb-3 font-semibold whitespace-nowrap">Onboarded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-3 pr-6 text-white font-medium truncate max-w-[220px]">
                  {row.email}
                </td>
                <td className={`py-3 pr-6 font-semibold ${planColor(row.plan)}`}>
                  {row.plan}
                </td>
                <td className="py-3 pr-6 text-gray-300 whitespace-nowrap">
                  {fmt(row.signedUp)}
                </td>
                <td className="py-3 pr-6 text-gray-300 whitespace-nowrap">
                  {fmt(row.lastActive)}
                </td>
                <td className="py-3 pr-6 text-gray-300 text-right tabular-nums">
                  {row.total}
                </td>
                <td className="py-3 pr-6 text-gray-300 text-right tabular-nums">
                  {row.sent}
                </td>
                <td className="py-3">
                  {row.onboarded ? (
                    <span className="text-emerald-400 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center text-gray-500 py-16">No users found.</div>
        )}
      </div>
    </div>
  );
}
