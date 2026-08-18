import { SupabaseClient } from "@supabase/supabase-js";
import { daysAgo } from "@/lib/utils";

interface Bucket {
  total: number;
  wins: number;
  totalPips: number;
}

export interface BreakdownRow {
  label: string;
  signals: number;
  winRate: number | null;
  avgPips: number | null;
}

export interface CommunityReport {
  windowDays: number;
  totalClosed: number;
  overallWinRate: number | null;
  overallAvgPips: number | null;
  byConfidence: BreakdownRow[];
  byDirection: BreakdownRow[];
  byDayOfWeek: BreakdownRow[];
  bySession: BreakdownRow[];
}

const CONFIDENCE_BUCKETS: [number, number, string][] = [
  [0, 50, "0-50"],
  [50, 60, "50-60"],
  [60, 70, "60-70"],
  [70, 80, "70-80"],
  [80, 90, "80-90"],
  [90, 101, "90-100"],
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function bump(map: Record<string, Bucket>, key: string, win: boolean, pips: number) {
  if (!map[key]) map[key] = { total: 0, wins: 0, totalPips: 0 };
  map[key].total++;
  if (win) map[key].wins++;
  map[key].totalPips += pips;
}

function toRows(
  map: Record<string, Bucket>,
  order?: string[],
): BreakdownRow[] {
  const keys = order ?? Object.keys(map);
  return keys
    .filter((k) => map[k])
    .map((label) => {
      const b = map[label];
      return {
        label,
        signals: b.total,
        winRate: b.total > 0 ? (b.wins / b.total) * 100 : null,
        avgPips: b.total > 0 ? b.totalPips / b.total : null,
      };
    });
}

/**
 * Factor-analysis report for community signals — the "why are signals
 * winning/losing" breakdown that the top-level Community Signals section
 * on the Signals page doesn't cover. Same dimensions the synthetic
 * backtest results-aggregator reports (confidence bucket, direction,
 * day-of-week, session) so this real-signal report and a backtest run
 * are directly comparable.
 *
 * Uses `outcome`/`pips_gained_lost` (cron-resolved) — not the sparse
 * `manual_outcome`/`manual_pnl_pips` fields.
 */
export async function getCommunitySignalReport(
  supabase: SupabaseClient,
  windowDays = 90,
): Promise<CommunityReport> {
  const since = daysAgo(windowDays).toISOString();

  const { data } = await supabase
    .from("market_signal")
    .select("direction, confidence_score, outcome, pips_gained_lost, created_at, analysis_data")
    .eq("source", "community")
    .eq("status", "closed")
    .gte("created_at", since);

  const rows = data ?? [];

  const confidenceMap: Record<string, Bucket> = {};
  const directionMap: Record<string, Bucket> = {};
  const dayMap: Record<string, Bucket> = {};
  const sessionMap: Record<string, Bucket> = {};

  let totalWins = 0;
  let totalPips = 0;

  for (const r of rows) {
    const outcome = r.outcome as string | null;
    const win = !!outcome?.startsWith("TP");
    const pips = Number(r.pips_gained_lost ?? 0);
    if (win) totalWins++;
    totalPips += pips;

    const confidence = r.confidence_score as number | null;
    if (confidence !== null) {
      const bucket = CONFIDENCE_BUCKETS.find(
        ([lo, hi]) => confidence >= lo && confidence < hi,
      );
      if (bucket) bump(confidenceMap, bucket[2], win, pips);
    }

    const direction = r.direction as string | null;
    if (direction) bump(directionMap, direction, win, pips);

    const createdAt = r.created_at as string;
    if (createdAt) {
      const dayName = DAY_NAMES[new Date(createdAt).getUTCDay()];
      bump(dayMap, dayName, win, pips);
    }

    const analysisData = r.analysis_data as Record<string, unknown> | null;
    const marketContext = analysisData?.market_context as
      | Record<string, unknown>
      | undefined;
    const session = marketContext?.current_session as string | undefined;
    if (session) bump(sessionMap, session, win, pips);
  }

  return {
    windowDays,
    totalClosed: rows.length,
    overallWinRate: rows.length > 0 ? (totalWins / rows.length) * 100 : null,
    overallAvgPips: rows.length > 0 ? totalPips / rows.length : null,
    byConfidence: toRows(
      confidenceMap,
      CONFIDENCE_BUCKETS.map((b) => b[2]),
    ),
    byDirection: toRows(directionMap),
    byDayOfWeek: toRows(dayMap, DAY_NAMES),
    bySession: toRows(sessionMap),
  };
}
