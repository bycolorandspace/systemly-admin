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
  profitFactor: number | null;
  expectancyPips: number | null;
  totalTrades: number | null;
}

/** Backtest trial history for one strategy id (normally a candidate copy). */
export async function getBacktestTrials(
  supabase: SupabaseClient,
  strategyId: string,
): Promise<BacktestTrial[]> {
  const { data } = await supabase
    .from("backtests")
    .select("id, label, created_at, status, primary_timeframe, symbol, summary")
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
}

export async function getTuningExperiments(
  supabase: SupabaseClient,
  liveStrategyId: string,
): Promise<TuningExperiment[]> {
  const { data } = await supabase
    .from("strategy_tuning_experiments")
    .select(
      "id, hypothesis, source, status, candidate_strategy_id, backtest_id, created_at, decided_at, promoted_at",
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
  }));
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
