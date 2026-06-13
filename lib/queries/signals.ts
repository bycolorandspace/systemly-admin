import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo, formatShortDate } from "@/lib/utils";

export async function getSignalVolumeTrend(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();

  const { data } = await supabase
    .from("market_signal")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  const dayMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = daysAgo(i);
    dayMap[formatShortDate(d.toISOString())] = 0;
  }

  for (const r of data ?? []) {
    const label = formatShortDate(r.created_at as string);
    if (label in dayMap) dayMap[label]++;
  }

  return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
}

export async function getWinRateTrend(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();

  const { data } = await supabase
    .from("market_signal")
    .select("created_at, manual_outcome")
    .not("manual_outcome", "is", null)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true });

  const windowSize = 7;
  const rows = data ?? [];

  const grouped: Record<string, { wins: number; losses: number }> = {};
  for (let i = 29; i >= 0; i--) {
    grouped[formatShortDate(daysAgo(i).toISOString())] = { wins: 0, losses: 0 };
  }

  for (const r of rows) {
    const label = formatShortDate(r.created_at as string);
    if (!(label in grouped)) continue;
    const o = r.manual_outcome as string;
    if (o.startsWith("TP")) grouped[label].wins++;
    else if (o === "SL_HIT") grouped[label].losses++;
  }

  const labels = Object.keys(grouped);
  return labels.map((date, i) => {
    const slice = labels.slice(Math.max(0, i - windowSize + 1), i + 1);
    const wins = slice.reduce((s, d) => s + grouped[d].wins, 0);
    const losses = slice.reduce((s, d) => s + grouped[d].losses, 0);
    const rate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;
    return { date, winRate: rate };
  });
}

export async function getStrategyPerformance(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();

  const { data } = await supabase
    .from("strategy_usage_logs")
    .select("strategy_id, outcome, pips_result, strategies(name)")
    .gte("created_at", thirtyDaysAgo);

  const map: Record<
    string,
    { name: string; total: number; wins: number; totalPips: number }
  > = {};

  for (const r of data ?? []) {
    const sid = r.strategy_id as string;
    const stratName =
      (r.strategies as { name?: string } | null)?.name ?? sid;
    if (!map[sid]) map[sid] = { name: stratName, total: 0, wins: 0, totalPips: 0 };
    map[sid].total++;
    if ((r.outcome as string) === "win") map[sid].wins++;
    map[sid].totalPips += Number(r.pips_result ?? 0);
  }

  return Object.values(map)
    .map((s) => ({
      name: s.name,
      signals: s.total,
      winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0,
      avgPips: s.total > 0 ? s.totalPips / s.total : 0,
    }))
    .sort((a, b) => b.signals - a.signals)
    .slice(0, 10);
}

export async function getShareDetail(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("signal_shares")
    .select("id, view_count, expires_at, created_at, signal_id, user_id")
    .order("view_count", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];

  const signalIds = [...new Set(data.map((r) => r.signal_id).filter(Boolean))] as string[];
  const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))] as string[];

  const [signals, users] = await Promise.all([
    signalIds.length > 0
      ? supabase.from("market_signal").select("id, symbol, direction").in("id", signalIds)
      : { data: [] },
    userIds.length > 0
      ? supabase.from("user_profiles").select("id, full_name").in("id", userIds)
      : { data: [] },
  ]);

  const signalMap = Object.fromEntries((signals.data ?? []).map((s) => [s.id, s]));
  const userMap = Object.fromEntries((users.data ?? []).map((u) => [u.id, u]));
  const now = Date.now();

  return data.map((share) => ({
    id: share.id as string,
    viewCount: (share.view_count as number) ?? 0,
    createdAt: share.created_at as string,
    expiresAt: share.expires_at as string | null,
    active: !share.expires_at || new Date(share.expires_at as string).getTime() > now,
    symbol: (signalMap[share.signal_id as string]?.symbol as string) ?? "—",
    direction: (signalMap[share.signal_id as string]?.direction as string) ?? "—",
    sharerName: (userMap[share.user_id as string]?.full_name as string) ?? "—",
  }));
}

export async function getBestSignalThisWeek(supabase: SupabaseClient) {
  const sevenDaysAgo = daysAgo(7).toISOString();
  const { data } = await supabase
    .from("market_signal")
    .select("id, symbol, direction, manual_outcome, manual_pnl_pips, created_at")
    .like("manual_outcome", "TP%")
    .gte("created_at", sevenDaysAgo)
    .order("manual_pnl_pips", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

export async function getCommunitySignals(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();
  const sevenDaysAgo = daysAgo(7).toISOString();
  const oneDayAgo = daysAgo(1).toISOString();

  const { data } = await supabase
    .from("market_signal")
    .select(
      "id, symbol, direction, created_at, status, outcome, pips_gained_lost, manual_outcome, manual_pnl_pips, confidence_score",
    )
    .eq("source", "community")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data ?? [];

  const today = rows.filter((r) => (r.created_at as string) >= oneDayAgo).length;
  const week = rows.filter((r) => (r.created_at as string) >= sevenDaysAgo).length;
  const open = rows.filter((r) => r.status === "open").length;
  const resolved = rows.filter((r) => r.manual_outcome);
  const wins = resolved.filter((r) => (r.manual_outcome as string).startsWith("TP")).length;
  const winRate = resolved.length > 0 ? (wins / resolved.length) * 100 : null;

  const symMap: Record<string, { total: number; wins: number; totalPips: number; resolved: number }> = {};
  for (const r of rows) {
    const sym = r.symbol as string;
    if (!symMap[sym]) symMap[sym] = { total: 0, wins: 0, totalPips: 0, resolved: 0 };
    symMap[sym].total++;
    const o = r.manual_outcome as string | null;
    if (o) {
      symMap[sym].resolved++;
      if (o.startsWith("TP")) symMap[sym].wins++;
      symMap[sym].totalPips += Number(r.manual_pnl_pips ?? 0);
    }
  }
  const bySymbol = Object.entries(symMap)
    .map(([symbol, s]) => ({
      symbol,
      signals: s.total,
      winRate: s.resolved > 0 ? (s.wins / s.resolved) * 100 : null,
      avgPips: s.resolved > 0 ? s.totalPips / s.resolved : null,
    }))
    .sort((a, b) => b.signals - a.signals);

  const recent = rows.slice(0, 30).map((r) => ({
    id: r.id as string,
    symbol: r.symbol as string,
    direction: r.direction as string,
    createdAt: r.created_at as string,
    status: r.status as string,
    outcome: ((r.manual_outcome ?? r.outcome) as string | null),
    pips: ((r.manual_pnl_pips ?? r.pips_gained_lost) as number | null),
    confidence: r.confidence_score as number | null,
  }));

  return {
    stats: { today, week, total30d: rows.length, open, winRate },
    bySymbol,
    recent,
  };
}

export async function getSymbolPerformance(supabase: SupabaseClient) {
  const thirtyDaysAgo = daysAgo(30).toISOString();

  const { data } = await supabase
    .from("market_signal")
    .select("symbol, manual_outcome, manual_pnl_pips")
    .gte("created_at", thirtyDaysAgo);

  const map: Record<
    string,
    { total: number; wins: number; totalPips: number; resolved: number }
  > = {};

  for (const r of data ?? []) {
    const sym = r.symbol as string;
    if (!map[sym]) map[sym] = { total: 0, wins: 0, totalPips: 0, resolved: 0 };
    map[sym].total++;
    const o = r.manual_outcome as string | null;
    if (o) {
      map[sym].resolved++;
      if (o.startsWith("TP")) map[sym].wins++;
      map[sym].totalPips += Number(r.manual_pnl_pips ?? 0);
    }
  }

  const rows = Object.entries(map).map(([symbol, s]) => ({
    symbol,
    signals: s.total,
    winRate: s.resolved > 0 ? (s.wins / s.resolved) * 100 : null,
    avgPips: s.resolved > 0 ? s.totalPips / s.resolved : null,
  }));

  return {
    byVolume: [...rows].sort((a, b) => b.signals - a.signals).slice(0, 15),
    byProfitability: rows
      .filter((r) => r.avgPips !== null && r.signals >= 3)
      .sort((a, b) => (b.avgPips ?? 0) - (a.avgPips ?? 0))
      .slice(0, 10),
  };
}
