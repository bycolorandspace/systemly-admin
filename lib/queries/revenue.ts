import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo, formatShortDate } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  starter: 25,
  plus: 55,
  pro: 199,
};

export async function getMRRTrend(supabase: SupabaseClient) {
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_start, canceled_at, created_at")
    .in("status", ["active", "canceled"]);

  const points: { date: string; mrr: number; starter: number; plus: number; pro: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const day = daysAgo(i);
    day.setUTCHours(23, 59, 59, 999);
    const dayStr = day.toISOString();

    const counts: Record<string, number> = { starter: 0, plus: 0, pro: 0 };
    for (const s of subs ?? []) {
      const start = new Date(s.current_period_start as string).getTime();
      const canceledAt = s.canceled_at ? new Date(s.canceled_at as string).getTime() : null;
      if (start <= day.getTime() && (!canceledAt || canceledAt > day.getTime())) {
        const t = s.tier as string;
        if (t in counts) counts[t]++;
      }
    }
    const mrr =
      counts.starter * 25 + counts.plus * 55 + counts.pro * 199;

    points.push({
      date: formatShortDate(dayStr),
      mrr,
      starter: counts.starter * 25,
      plus: counts.plus * 55,
      pro: counts.pro * 199,
    });
  }

  return points;
}

export async function getSubscriptionEvents(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("subscriptions")
    .select("id, tier, status, cancel_at_period_end, canceled_at, current_period_start, current_period_end, stripe_subscription_id, created_at, user_id")
    .order("current_period_start", { ascending: false })
    .limit(15);

  return data ?? [];
}

export async function getReferralStats(supabase: SupabaseClient) {
  const [codes, referrals, grants] = await Promise.all([
    supabase.from("affiliate_codes").select("*", { count: "exact", head: true }),
    supabase.from("referrals").select("*", { count: "exact", head: true }),
    supabase.from("reward_grants").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalCodes: codes.count ?? 0,
    totalReferrals: referrals.count ?? 0,
    totalGrants: grants.count ?? 0,
  };
}

export async function getAffiliateDetails(supabase: SupabaseClient) {
  const [codes, referrals, grants] = await Promise.all([
    supabase.from("affiliate_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*"),
    supabase.from("reward_grants").select("*"),
  ]);

  return {
    codes: codes.data ?? [],
    referrals: referrals.data ?? [],
    grants: grants.data ?? [],
  };
}
