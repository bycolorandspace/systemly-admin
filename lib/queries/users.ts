import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo } from "@/lib/utils";

export async function getUsersList(
  supabase: SupabaseClient,
  {
    search = "",
    tierFilter = "all",
    page = 0,
    pageSize = 50,
  }: { search?: string; tierFilter?: string; page?: number; pageSize?: number }
) {
  let query = supabase
    .from("user_profiles")
    .select(
      `id, full_name, email, current_tier, created_at`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  if (tierFilter !== "all") {
    query = query.eq("current_tier", tierFilter);
  }

  const { data, count } = await query;

  if (!data) return { users: [], total: 0 };

  const userIds = data.map((u) => u.id as string);

  const [signalCounts, lastActive, mt5Connected] = await Promise.all([
    supabase
      .from("usage_tracking")
      .select("user_id, count")
      .in("user_id", userIds)
      .eq("usage_type", "signals"),
    supabase
      .from("market_signal")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("mt5_connections")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "connected"),
  ]);

  const signalMap: Record<string, number> = {};
  for (const r of signalCounts.data ?? []) {
    const uid = r.user_id as string;
    signalMap[uid] = (signalMap[uid] ?? 0) + Number(r.count);
  }

  const lastActiveMap: Record<string, string> = {};
  for (const r of lastActive.data ?? []) {
    const uid = r.user_id as string;
    if (!lastActiveMap[uid]) lastActiveMap[uid] = r.created_at as string;
  }

  const mt5Set = new Set((mt5Connected.data ?? []).map((r) => r.user_id as string));

  const users = data.map((u) => ({
    id: u.id as string,
    fullName: (u.full_name as string) || "—",
    email: (u.email as string) || "—",
    tier: (u.current_tier as string) || "free",
    createdAt: u.created_at as string,
    lifetimeSignals: signalMap[u.id as string] ?? 0,
    lastActive: lastActiveMap[u.id as string] ?? null,
    hasMt5: mt5Set.has(u.id as string),
  }));

  return { users, total: count ?? 0 };
}

export async function getUserDetail(supabase: SupabaseClient, userId: string) {
  const [profile, signals, usageRows, subscriptions, academyProgress] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", userId).single(),
      supabase
        .from("market_signal")
        .select("id, symbol, direction, created_at, manual_outcome, manual_pnl_pips")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("usage_tracking")
        .select("usage_type, count, period_start")
        .eq("user_id", userId)
        .order("period_start", { ascending: false })
        .limit(6),
      supabase
        .from("subscriptions")
        .select("tier, status, current_period_start, current_period_end, canceled_at, stripe_subscription_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("academy_user_progress")
        .select("course_id, completed_lessons, total_lessons, completed_at")
        .eq("user_id", userId),
    ]);

  return {
    profile: profile.data,
    signals: signals.data ?? [],
    usage: usageRows.data ?? [],
    subscriptions: subscriptions.data ?? [],
    academyProgress: academyProgress.data ?? [],
  };
}
