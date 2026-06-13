import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo, getMonthStart } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = {
  starter: 25,
  plus: 55,
  pro: 199,
};

export async function getSystemHealth(supabase: SupabaseClient) {
  const [mt5Count, alertCount, sharingConfig, tradingConfig, signalsConfig, feedConfig] =
    await Promise.all([
      supabase
        .from("mt5_connections")
        .select("*", { count: "exact", head: true })
        .eq("status", "connected"),
      supabase
        .from("price_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("system_config")
        .select("value")
        .eq("key", "signal_sharing")
        .maybeSingle(),
      supabase
        .from("system_config")
        .select("value")
        .eq("key", "test_trading")
        .maybeSingle(),
      supabase
        .from("system_config")
        .select("value")
        .eq("key", "community_signals")
        .maybeSingle(),
      supabase
        .from("system_config")
        .select("value")
        .eq("key", "community_feed")
        .maybeSingle(),
    ]);

  return {
    mt5ActiveConnections: mt5Count.count ?? 0,
    activePriceAlerts: alertCount.count ?? 0,
    signalSharingPaused:
      (sharingConfig.data?.value as { paused?: boolean } | null)?.paused ??
      false,
    testTradingPaused:
      (tradingConfig.data?.value as { paused?: boolean } | null)?.paused ??
      false,
    communitySignalsPaused:
      (signalsConfig.data?.value as { paused?: boolean } | null)?.paused ??
      true,
    communityFeedPaused:
      (feedConfig.data?.value as { paused?: boolean } | null)?.paused ??
      true,
  };
}

export async function getGrowthKPIs(supabase: SupabaseClient) {
  const sevenDaysAgo = daysAgo(7).toISOString();
  const thirtyDaysAgo = daysAgo(30).toISOString();
  const todayStart = getMonthStart().toISOString();

  const [totalUsers, newLast7d, newLast30d, allProfiles, dau, wau, mau] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase.from("user_profiles").select("current_tier"),
      supabase
        .from("market_signal")
        .select("user_id")
        .gte("created_at", todayStart),
      supabase
        .from("market_signal")
        .select("user_id")
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("market_signal")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo),
    ]);

  const tierDist: Record<string, number> = {
    free: 0,
    starter: 0,
    plus: 0,
    pro: 0,
  };
  for (const row of allProfiles.data ?? []) {
    const t = (row.current_tier as string) || "free";
    if (t in tierDist) tierDist[t]++;
  }

  const uniqueIds = (rows: { user_id: string }[]) =>
    new Set(rows.map((r) => r.user_id)).size;

  return {
    totalUsers: totalUsers.count ?? 0,
    newLast7d: newLast7d.count ?? 0,
    newLast30d: newLast30d.count ?? 0,
    tierDist,
    dau: uniqueIds(dau.data ?? []),
    wau: uniqueIds(wau.data ?? []),
    mau: uniqueIds(mau.data ?? []),
  };
}

export async function getRevenueKPIs(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();
  const monthStart = getMonthStart().toISOString();

  const [activeSubs, totalUsers, recentEvents, churnedLast30d, costs, trialingSubs, newPaidSubs] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("tier, status")
        .eq("status", "active"),
      supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("tier, status, cancel_at_period_end, canceled_at, current_period_start, created_at, user_id")
        .order("current_period_start", { ascending: false })
        .limit(8),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("canceled_at", thirtyDaysAgo),
      supabase
        .from("cost_entries")
        .select("amount_gbp")
        .eq(
          "period_month",
          getMonthStart().toISOString().split("T")[0]
        ),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "trialing"),
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .gte("created_at", monthStart),
    ]);

  const tierCounts: Record<string, number> = { starter: 0, plus: 0, pro: 0 };
  for (const s of activeSubs.data ?? []) {
    const t = s.tier as string;
    if (t in tierCounts) tierCounts[t]++;
  }
  const mrr = Object.entries(tierCounts).reduce(
    (sum, [tier, count]) => sum + (TIER_PRICES[tier] ?? 0) * count,
    0
  );
  const totalPaidSubs = Object.values(tierCounts).reduce((a, b) => a + b, 0);
  const totalU = totalUsers.count ?? 1;
  const conversionRate = (totalPaidSubs / totalU) * 100;

  const totalCosts = (costs.data ?? []).reduce(
    (sum, r) => sum + Number(r.amount_gbp),
    0
  );

  const churnedCount = churnedLast30d.count ?? 0;
  const trialCount = trialingSubs.count ?? 0;
  const newPaidThisMonth = newPaidSubs.count ?? 0;
  const arpu = totalPaidSubs > 0 ? mrr / totalPaidSubs : 0;

  return {
    mrr,
    arr: mrr * 12,
    totalPaidSubs,
    conversionRate,
    recentEvents: recentEvents.data ?? [],
    churnedLast30d: churnedCount,
    tierCounts,
    totalCosts,
    profit: mrr - totalCosts,
    margin: mrr > 0 ? ((mrr - totalCosts) / mrr) * 100 : -100,
    trialCount,
    newPaidThisMonth,
    arpu,
  };
}

export async function getSignalIntelligence(supabase: SupabaseClient) {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = daysAgo(7).toISOString();
  const thirtyDaysAgo = daysAgo(30).toISOString();

  const [todayCount, last7d, last30d, outcomes, symbols, shares] =
    await Promise.all([
      supabase
        .from("market_signal")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase
        .from("market_signal")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("market_signal")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("market_signal")
        .select("manual_outcome")
        .not("manual_outcome", "is", null)
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("market_signal")
        .select("symbol")
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("signal_shares")
        .select("view_count, expires_at, created_at"),
    ]);

  const outcomeMap: Record<string, number> = {};
  for (const r of outcomes.data ?? []) {
    const o = r.manual_outcome as string;
    outcomeMap[o] = (outcomeMap[o] ?? 0) + 1;
  }
  const tpHits =
    (outcomeMap["TP1_HIT"] ?? 0) +
    (outcomeMap["TP2_HIT"] ?? 0) +
    (outcomeMap["TP3_HIT"] ?? 0);
  const slHits = outcomeMap["SL_HIT"] ?? 0;
  const winRate =
    tpHits + slHits > 0 ? (tpHits / (tpHits + slHits)) * 100 : null;

  const symbolMap: Record<string, number> = {};
  for (const r of symbols.data ?? []) {
    const s = r.symbol as string;
    symbolMap[s] = (symbolMap[s] ?? 0) + 1;
  }
  const sortedSymbols = Object.entries(symbolMap).sort((a, b) => b[1] - a[1]);
  const topSymbol = sortedSymbols[0]?.[0] ?? "—";
  const topSymbols = sortedSymbols.slice(0, 3).map(([sym, count]) => ({ sym, count }));

  const now = Date.now();
  const sharesList = shares.data ?? [];
  const activeShares = sharesList.filter(
    (s) => !s.expires_at || new Date(s.expires_at).getTime() > now
  ).length;
  const totalViews = sharesList.reduce(
    (sum, s) => sum + ((s.view_count as number) ?? 0),
    0
  );

  const avgViewsPerShare = activeShares > 0 ? Math.round(totalViews / activeShares) : 0;

  return {
    signalsToday: todayCount.count ?? 0,
    signalsLast7d: last7d.count ?? 0,
    signalsLast30d: last30d.count ?? 0,
    winRate,
    outcomeMap,
    topSymbol,
    topSymbols,
    activeShares,
    totalViews,
    avgViewsPerShare,
  };
}

export async function getAnthropicVolume(supabase: SupabaseClient) {
  const monthStart = getMonthStart().toISOString();
  const { data } = await supabase
    .from("usage_tracking")
    .select("count")
    .eq("usage_type", "signals")
    .gte("period_start", monthStart);

  const total = (data ?? []).reduce((sum, r) => sum + Number(r.count), 0);
  return { callsThisMonth: total };
}

export async function getCostBreakdown(supabase: SupabaseClient) {
  const monthStart = getMonthStart().toISOString().split("T")[0];
  const { data } = await supabase
    .from("cost_entries")
    .select("service_name, amount_gbp")
    .eq("period_month", monthStart)
    .order("amount_gbp", { ascending: false });

  return data ?? [];
}
