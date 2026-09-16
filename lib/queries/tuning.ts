import { SupabaseClient } from "@supabase/supabase-js";

export interface StrategyRecord {
  id: string;
  name: string;
  ownership: string;
  visibility: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: Record<string, any>;
  created_at: string;
}

export async function getStrategyRecord(
  supabase: SupabaseClient,
  id: string,
): Promise<StrategyRecord | null> {
  const { data } = await supabase
    .from("strategies")
    .select("id, name, ownership, visibility, config, created_at")
    .eq("id", id)
    .maybeSingle();
  return data as StrategyRecord | null;
}

export interface BacktestTrial {
  id: string;
  label: string | null;
  createdAt: string;
  status: string;
  primaryTimeframe: string;
  symbol: string;
  winRate: number | null;
  /** Legacy pips profit factor, no cost. Only shown for pre-fix runs. */
  profitFactor: number | null;
  expectancyPips: number | null;
  totalTrades: number | null;
  /** Set when the result was marked invalid evidence (see invalid_reason). */
  invalidatedAt: string | null;
  invalidReason: string | null;
  /**
   * Present only on runs from the leak-free engine (main app
   * config/backtest-validation.ts BACKTEST_ENGINE_VERSION). Absent means the
   * run could see candles that closed after each decision.
   */
  engineVersion: string | null;
  /** Headline: profit factor in R after modelled cost. */
  profitFactorR: number | null;
  profitFactorRCi95: [number, number] | null;
  expectancyR: number | null;
  leakReview: BacktestLeakReviewSummary | null;
}

export type LeakReviewStatus = "flagged" | "clear" | "insufficient_sample";

/** The subset of the main app's BacktestLeakReview the admin reads. */
export interface BacktestLeakReviewSummary {
  status: LeakReviewStatus;
  excessPts: number | null;
  resolvedTrades: number;
  thresholdPts: number;
}

export function readLeakReview(summary: Record<string, unknown>): BacktestLeakReviewSummary | null {
  const lr = summary.leakReview as Record<string, unknown> | undefined;
  if (!lr || typeof lr.status !== "string") return null;
  return {
    status: lr.status as LeakReviewStatus,
    excessPts: (lr.excessPts as number | null) ?? null,
    resolvedTrades: (lr.resolvedTrades as number) ?? 0,
    thresholdPts: (lr.thresholdPts as number) ?? 10,
  };
}

/** Backtest trial history for one strategy id (normally a candidate copy). */
export async function getBacktestTrials(
  supabase: SupabaseClient,
  strategyId: string,
): Promise<BacktestTrial[]> {
  const { data } = await supabase
    .from("backtests")
    .select(
      "id, label, created_at, status, primary_timeframe, symbol, summary, invalidated_at, invalid_reason",
    )
    .eq("strategy_id", strategyId)
    .order("created_at", { ascending: false })
    .limit(25);

  return (data ?? []).map((r) => {
    const summary = (r.summary ?? {}) as Record<string, unknown>;
    return {
      id: r.id as string,
      label: r.label as string | null,
      createdAt: r.created_at as string,
      status: r.status as string,
      primaryTimeframe: r.primary_timeframe as string,
      symbol: r.symbol as string,
      winRate: (summary.winRate as number) ?? null,
      profitFactor: (summary.profitFactor as number) ?? null,
      expectancyPips: (summary.expectancyPips as number) ?? null,
      totalTrades: (summary.totalTrades as number) ?? null,
      invalidatedAt: r.invalidated_at as string | null,
      invalidReason: r.invalid_reason as string | null,
      engineVersion: (summary.engineVersion as string) ?? null,
      profitFactorR: (summary.profitFactorR as number | null) ?? null,
      profitFactorRCi95: (summary.profitFactorRCi95 as [number, number] | null) ?? null,
      expectancyR: (summary.expectancyR as number | null) ?? null,
      leakReview: readLeakReview(summary),
    };
  });
}

export interface TuningExperiment {
  id: string;
  hypothesis: string;
  source: string;
  status: string;
  candidateStrategyId: string | null;
  backtestId: string | null;
  createdAt: string;
  decidedAt: string | null;
  promotedAt: string | null;
  /** Set when the experiment's evidence was marked invalid (see invalid_reason). */
  invalidatedAt: string | null;
  invalidReason: string | null;
  /**
   * The held-out-months promotion check, written by the main app's tuning
   * scripts into preflight_summary.promotion (evaluatePromotion in
   * lib/backtest/promotion-rule.ts). Null when it was never run, which blocks
   * promotion.
   */
  promotion: PromotionCheckSummary | null;
}

export type PromotionVerdict = "promote" | "hold" | "insufficient_evidence" | "invalid_window";

export interface PromotionCheckSummary {
  verdict: PromotionVerdict;
  failedChecks: string[];
}

export function readPromotion(preflight: unknown): PromotionCheckSummary | null {
  const p = (preflight as Record<string, unknown> | null)?.promotion as
    | Record<string, unknown>
    | undefined;
  if (!p || typeof p.verdict !== "string") return null;
  return {
    verdict: p.verdict as PromotionVerdict,
    failedChecks: Array.isArray(p.failedChecks) ? (p.failedChecks as string[]) : [],
  };
}

export async function getTuningExperiments(
  supabase: SupabaseClient,
  liveStrategyId: string,
): Promise<TuningExperiment[]> {
  const { data } = await supabase
    .from("strategy_tuning_experiments")
    .select(
      "id, hypothesis, source, status, candidate_strategy_id, backtest_id, created_at, decided_at, promoted_at, invalidated_at, invalid_reason, preflight_summary",
    )
    .eq("live_strategy_id", liveStrategyId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    hypothesis: r.hypothesis as string,
    source: r.source as string,
    status: r.status as string,
    candidateStrategyId: r.candidate_strategy_id as string | null,
    backtestId: r.backtest_id as string | null,
    createdAt: r.created_at as string,
    decidedAt: r.decided_at as string | null,
    promotedAt: r.promoted_at as string | null,
    invalidatedAt: r.invalidated_at as string | null,
    invalidReason: r.invalid_reason as string | null,
    promotion: readPromotion(r.preflight_summary),
  }));
}

export interface FlaggedBacktest {
  id: string;
  label: string | null;
  createdAt: string;
  userId: string | null;
  strategyId: string | null;
  symbol: string;
  primaryTimeframe: string;
  leakReview: BacktestLeakReviewSummary;
}

/**
 * Backtests the engine flagged for a leak review: a win rate more than the
 * threshold above what chance gives at the same distances. Filters on the
 * stored summary JSON, so no extra column or job is needed.
 */
export async function getLeakFlaggedBacktests(
  supabase: SupabaseClient,
): Promise<FlaggedBacktest[]> {
  const { data } = await supabase
    .from("backtests")
    .select("id, label, created_at, user_id, strategy_id, symbol, primary_timeframe, summary")
    .eq("summary->leakReview->>status", "flagged")
    .is("invalidated_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).flatMap((r) => {
    const leakReview = readLeakReview((r.summary ?? {}) as Record<string, unknown>);
    if (!leakReview) return [];
    return [
      {
        id: r.id as string,
        label: r.label as string | null,
        createdAt: r.created_at as string,
        userId: r.user_id as string | null,
        strategyId: r.strategy_id as string | null,
        symbol: r.symbol as string,
        primaryTimeframe: r.primary_timeframe as string,
        leakReview,
      },
    ];
  });
}

/**
 * The "current" candidate copy for a strategy — the most recently
 * referenced candidate_strategy_id across its experiments. Null if no
 * trial has been linked to a candidate yet.
 */
export function pickCurrentCandidateId(
  experiments: TuningExperiment[],
): string | null {
  for (const exp of experiments) {
    if (exp.candidateStrategyId) return exp.candidateStrategyId;
  }
  return null;
}
