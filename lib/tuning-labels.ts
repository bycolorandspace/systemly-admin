import type { BacktestTrial, LeakReviewStatus, PromotionVerdict } from "@/lib/queries/tuning";

/**
 * Labels for the backtest-integrity checks computed in the main app
 * (lib/backtest/leak-review.ts, lib/backtest/promotion-rule.ts). Kept here so
 * the tuning page, the flagged list and the promote gate read the same words.
 */

export const LEAK_REVIEW_LABEL: Record<LeakReviewStatus, string> = {
  flagged: "Review for leak",
  clear: "Clear",
  insufficient_sample: "Too few trades",
};

export const PROMOTION_VERDICT_LABEL: Record<PromotionVerdict, string> = {
  promote: "Passed held-out check",
  hold: "Held: did not beat current settings on held-out months",
  insufficient_evidence: "Held: not enough held-out trades to judge",
  invalid_window: "Held: held-out months overlap the tuning months",
};

export const PROMOTION_CHECK_LABEL: Record<string, string> = {
  holdout_declared: "held-out months declared before tuning",
  holdout_after_tuning: "held-out months come after the tuning months",
  min_holdout_trades: "enough held-out trades",
  min_holdout_days: "enough held-out trading days",
  profit_factor_r: "profit factor after costs above 1",
  profit_factor_r_stress_cost: "profit factor at double costs at least 1",
  paired_mean_r_difference: "improvement over current settings clear of zero",
  without_best_symbol: "still above 1 without the best symbol",
};

/**
 * The trial's evidence status: marked invalid, run on the pre-fix engine, or
 * from the leak-free engine.
 */
export function trialEvidenceLabel(t: Pick<BacktestTrial, "invalidatedAt" | "engineVersion">): string {
  if (t.invalidatedAt) return "INVALID";
  if (!t.engineVersion) return "PRE-FIX";
  return "OK";
}

/** Profit factor in R after cost with its 95% range; pre-fix runs show the legacy pips figure, labelled. */
export function formatTrialProfitFactor(
  t: Pick<BacktestTrial, "engineVersion" | "profitFactorR" | "profitFactorRCi95" | "profitFactor">,
): string {
  if (!t.engineVersion) {
    return t.profitFactor !== null ? `${t.profitFactor.toFixed(2)} (pips, no cost)` : "—";
  }
  if (t.profitFactorR === null) return "—";
  const ci = t.profitFactorRCi95 ? ` [${t.profitFactorRCi95[0].toFixed(2)}, ${t.profitFactorRCi95[1].toFixed(2)}]` : "";
  return `${t.profitFactorR.toFixed(2)}${ci}`;
}

export function formatTrialExpectancy(
  t: Pick<BacktestTrial, "engineVersion" | "expectancyR" | "expectancyPips">,
): string {
  if (!t.engineVersion) {
    return t.expectancyPips !== null ? `${t.expectancyPips.toFixed(1)} pips` : "—";
  }
  if (t.expectancyR === null) return "—";
  return `${t.expectancyR >= 0 ? "+" : ""}${t.expectancyR.toFixed(2)}R`;
}

export function formatLeakReview(t: Pick<BacktestTrial, "leakReview">): string {
  if (!t.leakReview) return "—";
  const label = LEAK_REVIEW_LABEL[t.leakReview.status];
  if (t.leakReview.excessPts === null) return label;
  const sign = t.leakReview.excessPts >= 0 ? "+" : "";
  return `${label} (${sign}${t.leakReview.excessPts.toFixed(1)} pts vs chance)`;
}

export function formatFailedChecks(keys: string[]): string {
  return keys.map((k) => PROMOTION_CHECK_LABEL[k] ?? k.replace(/_/g, " ")).join("; ");
}
