import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo, getMonthStart } from "@/lib/utils";

/**
 * Which kind of recent activity the list is ordered and filtered by.
 *
 * "all" keeps the default newest-signup order. The other two answer "who has
 * been using this lately", which the join date cannot: an account from March
 * that ran a signal yesterday is the one worth looking at, and it sits on page
 * four by signup order.
 */
export type UserActivityFilter = "all" | "signal" | "academy";

/**
 * Academy use, as core can see it.
 *
 * Every academy table lives in a second Supabase project that this dashboard
 * holds no credentials for (see `lib/queries/engagement.ts`). These four event
 * names are mirrored into core's own `user_events` by `MIRRORED_EVENTS` in the
 * main app's `config/analytics-events.ts`, so "when did they last open the
 * academy" is answerable here without a second client or a proxy call.
 *
 * The three `Academy Suggestion *` events are deliberately left out: they fire
 * on a card shown elsewhere in the app, so counting them would mark somebody as
 * an academy user for having scrolled past an advert for it.
 */
const ACADEMY_EVENT_NAMES = [
  "Academy Path Viewed",
  "Academy Course Viewed",
  "Academy Lesson Started",
  "Academy Course Completed",
];

/**
 * How many rows the activity filter reads before it stops, and how many users
 * it will rank.
 *
 * Neither Postgres client here can group, so "most recent per user" is done by
 * reading rows newest-first and keeping the first one seen per user. That means
 * the filtered list is the most recently active few hundred accounts rather
 * than every account that ever qualified, which is what the filter is for. The
 * count shown alongside it is the size of that window, not a lifetime total.
 */
const ACTIVITY_ROW_SCAN = 5000;
const ACTIVITY_USER_CAP = 500;

/**
 * User ids ordered by their most recent signal or academy event, newest first.
 */
async function getUsersByRecentActivity(
  supabase: SupabaseClient,
  activity: Exclude<UserActivityFilter, "all">,
): Promise<string[]> {
  // Two awaits rather than one builder held in a variable: the two tables give
  // the query builder different generic types, and a ternary over them makes
  // TypeScript give up on the chain that follows.
  let data: { user_id: string | null }[] | null = null;

  if (activity === "signal") {
    // Community signals carry no owner, so they are not somebody's use of the
    // product and must not put a null into the ranking.
    const res = await supabase
      .from("market_signal")
      .select("user_id")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_ROW_SCAN);
    data = res.data;
  } else {
    const res = await supabase
      .from("user_events")
      .select("user_id")
      .in("event_name", ACADEMY_EVENT_NAMES)
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_ROW_SCAN);
    data = res.data;
  }

  const seen: string[] = [];
  const have = new Set<string>();
  for (const row of data ?? []) {
    const uid = row.user_id as string;
    if (have.has(uid)) continue;
    have.add(uid);
    seen.push(uid);
    if (seen.length >= ACTIVITY_USER_CAP) break;
  }
  return seen;
}

export async function getUsersList(
  supabase: SupabaseClient,
  {
    search = "",
    tierFilter = "all",
    activityFilter = "all",
    page = 0,
    pageSize = 50,
  }: {
    search?: string;
    tierFilter?: string;
    activityFilter?: UserActivityFilter;
    page?: number;
    pageSize?: number;
  }
) {
  // Ranked ids first, because they decide both the order and the membership of
  // the page that is about to be fetched.
  const activityOrder =
    activityFilter === "all"
      ? null
      : await getUsersByRecentActivity(supabase, activityFilter);

  if (activityOrder && activityOrder.length === 0) {
    return { users: [], total: 0 };
  }

  let query = supabase
    .from("user_profiles")
    .select(
      `id, full_name, email, current_tier, created_at, onboarding_data`,
      { count: "exact" }
    );

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
  }
  if (tierFilter !== "all") {
    query = query.eq("current_tier", tierFilter);
  }

  let rows: Record<string, unknown>[];
  let total: number;

  if (activityOrder) {
    // Paged in memory: the order lives in `activityOrder`, which Postgres
    // cannot sort by, so the window has to be complete before it is sliced.
    const rank = new Map(activityOrder.map((id, i) => [id, i]));
    const { data } = await query.in("id", activityOrder);
    const ordered = (data ?? []).sort(
      (a, b) =>
        (rank.get(a.id as string) ?? Infinity) -
        (rank.get(b.id as string) ?? Infinity),
    );
    total = ordered.length;
    rows = ordered.slice(page * pageSize, (page + 1) * pageSize);
  } else {
    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    rows = data ?? [];
    total = count ?? 0;
  }

  if (rows.length === 0) return { users: [], total };

  const userIds = rows.map((u) => u.id as string);

  const [signalRows, academyRows, mt5Connected] = await Promise.all([
    // Signals themselves, not the allowance ledger. `usage_tracking` is what a
    // user has been charged for, and the main app deliberately does not charge
    // for an account's first ever signal (`isFirstEverSignal` in its
    // `lib/supabase/usage-service.ts`), so summing it reported 0 signals for
    // everybody who had generated exactly one. Counting `market_signal` counts
    // what was produced, which is what this column claims.
    supabase
      .from("market_signal")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_events")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .in("event_name", ACADEMY_EVENT_NAMES)
      .order("created_at", { ascending: false })
      .limit(ACTIVITY_ROW_SCAN),
    supabase
      .from("mt5_connections")
      .select("user_id")
      .in("user_id", userIds)
      .eq("status", "connected"),
  ]);

  const signalCount: Record<string, number> = {};
  const lastSignalMap: Record<string, string> = {};
  for (const r of signalRows.data ?? []) {
    const uid = r.user_id as string;
    signalCount[uid] = (signalCount[uid] ?? 0) + 1;
    // Rows arrive newest first, so the first one seen per user is the latest.
    if (!lastSignalMap[uid]) lastSignalMap[uid] = r.created_at as string;
  }

  const lastAcademyMap: Record<string, string> = {};
  for (const r of academyRows.data ?? []) {
    const uid = r.user_id as string;
    if (!lastAcademyMap[uid]) lastAcademyMap[uid] = r.created_at as string;
  }

  const mt5Set = new Set((mt5Connected.data ?? []).map((r) => r.user_id as string));

  const users = rows.map((u) => ({
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
    lifetimeSignals: signalCount[u.id as string] ?? 0,
    lastSignalAt: lastSignalMap[u.id as string] ?? null,
    lastAcademyAt: lastAcademyMap[u.id as string] ?? null,
    hasMt5: mt5Set.has(u.id as string),
  }));

  return { users, total };
}

export async function getUserDetail(supabase: SupabaseClient, userId: string) {
  const [profile, signals, usageRows, subscriptions] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("id", userId).single(),
      supabase
        .from("market_signal")
        .select("id, symbol, direction, created_at, manual_outcome, manual_pnl_pips")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      // This calendar month only. `usage_tracking` holds one row per type per
      // period, and a flat `limit(6)` reached back into previous months, so the
      // drawer's "this month" bars were summing several of them together. The
      // period boundary matches `getMonthlyPeriodStart()` in the main app's
      // `lib/supabase/usage-service.ts`, which is what writes these rows.
      supabase
        .from("usage_tracking")
        .select("usage_type, count, period_start")
        .eq("user_id", userId)
        .gte("period_start", getMonthStart().toISOString())
        .order("period_start", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("tier, status, current_period_start, current_period_end, canceled_at, stripe_subscription_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return {
    profile: profile.data,
    signals: signals.data ?? [],
    usage: usageRows.data ?? [],
    subscriptions: subscriptions.data ?? [],
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
