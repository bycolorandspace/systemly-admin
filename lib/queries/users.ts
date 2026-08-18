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
      `id, full_name, email, current_tier, created_at, onboarding_data`,
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
    // Self-reported answer to "How did you hear about Systemly?", asked on the
    // last onboarding step. Null for anyone who signed up and never finished
    // onboarding, which is a real and common state, not a data error.
    referralSource:
      ((u.onboarding_data as { referral_source?: string } | null)
        ?.referral_source ?? null),
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

export interface AcquisitionSource {
  source: string;
  count: number;
  /** Share of the users in this window who actually answered the question. */
  pct: number;
}

export interface AcquisitionWindow {
  /** Every profile created in the window, answered or not. */
  signups: number;
  answered: number;
  unanswered: number;
  sources: AcquisitionSource[];
}

export interface AcquisitionBreakdown {
  d7: AcquisitionWindow;
  d30: AcquisitionWindow;
  all: AcquisitionWindow;
}

const ACQUISITION_PAGE_SIZE = 1000;

/**
 * Self-reported acquisition mix from the last onboarding step, "How did you
 * hear about Systemly?".
 *
 * Onboarding captures no country or region, and `user_profiles.timezone` is
 * unpopulated, so this is the only "where did they come from" signal we hold.
 *
 * Percentages are share of *answered*, not share of signups: anyone who quit
 * onboarding before the last step has no source, and folding them into the
 * denominator would understate every channel by the same arbitrary amount.
 * The unanswered count is returned separately so the UI can show the gap.
 */
export async function getAcquisitionBreakdown(
  supabase: SupabaseClient
): Promise<AcquisitionBreakdown> {
  // Two tiny columns, paged to completion — PostgREST caps a single response
  // at 1000 rows, so a plain select would silently truncate the all-time
  // window once the account count passes it.
  const rows: { created_at: string; referral_source: string | null }[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("created_at, referral_source:onboarding_data->>referral_source")
      .order("created_at", { ascending: false })
      .range(page * ACQUISITION_PAGE_SIZE, (page + 1) * ACQUISITION_PAGE_SIZE - 1);

    if (error) {
      console.error("[getAcquisitionBreakdown] fetch failed:", error.message);
      break;
    }
    if (!data?.length) break;

    rows.push(...(data as typeof rows));
    if (data.length < ACQUISITION_PAGE_SIZE) break;
  }

  const cutoff7 = daysAgo(7).getTime();
  const cutoff30 = daysAgo(30).getTime();

  const build = (since: number): AcquisitionWindow => {
    const inWindow = rows.filter(
      (r) => new Date(r.created_at).getTime() >= since
    );
    const counts = new Map<string, number>();

    for (const r of inWindow) {
      const source = r.referral_source;
      if (!source) continue;
      counts.set(source, (counts.get(source) ?? 0) + 1);
    }

    const answered = [...counts.values()].reduce((a, b) => a + b, 0);
    const sources = [...counts.entries()]
      .map(([source, count]) => ({
        source,
        count,
        pct: answered > 0 ? (count / answered) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

    return {
      signups: inWindow.length,
      answered,
      unanswered: inWindow.length - answered,
      sources,
    };
  };

  return {
    d7: build(cutoff7),
    d30: build(cutoff30),
    all: build(0),
  };
}
