import Link from "next/link";
import { createAdminClient } from "@/lib/supabase";
import { Header } from "@/components/layout/header";
import { formatPercent, formatDate } from "@/lib/utils";
import { getSymbolPerformance } from "@/lib/queries/signals";
import {
  getStrategyRecord,
  getBacktestTrials,
  getTuningExperiments,
  pickCurrentCandidateId,
} from "@/lib/queries/tuning";
import { ConfigDiff } from "@/components/strategies/config-diff";
import { ExperimentRow } from "@/components/strategies/experiment-row";
import { PromoteButton } from "@/components/strategies/promote-button";
import { DuplicateButton } from "@/components/strategies/duplicate-button";
import { CandidateConfigEditor } from "@/components/strategies/candidate-config-editor";
import { PromotionCheckNote } from "@/components/strategies/promotion-check-note";
import {
  formatLeakReview,
  formatTrialExpectancy,
  formatTrialProfitFactor,
  trialEvidenceLabel,
} from "@/lib/tuning-labels";

export const revalidate = 0;

function SimpleTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[];
  rows: (string | number | null)[][];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
        {emptyMessage}
      </p>
    );
  }
  return (
    <table className="w-full text-xs">
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {columns.map((c) => (
            <th
              key={c}
              className="text-left px-4 py-2.5 font-medium tracking-wider uppercase text-[10px]"
              style={{ color: "var(--muted-foreground)" }}
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
            {row.map((cell, j) => (
              <td
                key={j}
                className="px-4 py-3 metric-number"
                style={{ color: j === 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
              >
                {cell ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="border rounded-lg overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          {title}
        </p>
        {description && (
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function StrategyTuningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [strategy, experiments, symbolPerformance] = await Promise.all([
    getStrategyRecord(supabase, id),
    getTuningExperiments(supabase, id),
    getSymbolPerformance(supabase, id),
  ]);

  if (!strategy) {
    return (
      <>
        <Header title="Strategy Tuning" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Strategy not found.
          </p>
        </div>
      </>
    );
  }

  const candidateId = pickCurrentCandidateId(experiments);
  const [candidate, backtestTrials] = await Promise.all([
    candidateId ? getStrategyRecord(supabase, candidateId) : Promise.resolve(null),
    candidateId ? getBacktestTrials(supabase, candidateId) : Promise.resolve([]),
  ]);

  // Invalid evidence can never be promoted, so it never appears as a potential update.
  const confirmedExperiments = experiments.filter(
    (e) => e.status === "confirmed" && !e.invalidatedAt,
  );
  const hasInvalidTrials = backtestTrials.some((t) => t.invalidatedAt || !t.engineVersion);

  return (
    <>
      <Header title={`Tuning — ${strategy.name}`} />
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Header strip */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {strategy.name}{" "}
                <span className="text-xs font-normal font-mono" style={{ color: "var(--muted-foreground)" }}>
                  {strategy.id}
                </span>
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {candidate ? (
                  <>
                    Candidate copy:{" "}
                    <Link
                      href={`/strategies/${candidate.id}/tuning`}
                      className="hover:underline"
                      style={{ color: "var(--primary)" }}
                    >
                      {candidate.name}
                    </Link>
                  </>
                ) : (
                  "No candidate copy linked yet."
                )}
              </p>
            </div>
            <DuplicateButton strategyId={strategy.id} />
          </div>

          <SectionCard
            title="Config Diff"
            description="Live strategy config vs. its linked candidate copy."
          >
            <div className="px-4 py-3">
              <ConfigDiff
                liveConfig={strategy.config}
                candidateConfig={candidate?.config ?? null}
              />
            </div>
          </SectionCard>

          {candidate && (
            <SectionCard
              title="Edit Candidate Config"
              description={`Raw StrategyConfig JSON for "${candidate.name}" — edits here only ever affect the candidate copy, never the live strategy.`}
            >
              <div className="px-4 py-3">
                <CandidateConfigEditor
                  strategyId={strategy.id}
                  candidateStrategyId={candidate.id}
                  initialConfig={candidate.config}
                />
              </div>
            </SectionCard>
          )}

          <SectionCard
            title="Backtest Trial History"
            description={
              hasInvalidTrials
                ? "Trials run against the candidate copy, most recent first. Profit factor is in R after modelled cost, with its 95% range. Rows marked INVALID or PRE-FIX could see candles that closed after each decision and were scored in pooled pips with no costs. Don't use them for decisions."
                : "Trials run against the candidate copy, most recent first. Profit factor is in R after modelled cost, with its 95% range. PRE-FIX rows could see candles that closed after each decision."
            }
          >
            <SimpleTable
              columns={["Label", "Evidence", "Symbol", "TF", "Win Rate", "PF after cost", "Avg result", "Leak review", "Created"]}
              emptyMessage="No backtest trials yet for the linked candidate."
              rows={backtestTrials.map((t) => [
                t.label ?? "(unlabeled)",
                trialEvidenceLabel(t),
                t.symbol,
                t.primaryTimeframe,
                t.winRate !== null ? formatPercent(t.winRate) : "—",
                formatTrialProfitFactor(t),
                formatTrialExpectancy(t),
                formatLeakReview(t),
                formatDate(t.createdAt),
              ])}
            />
          </SectionCard>

          <SectionCard
            title="Live Signal Performance by Symbol"
            description="Resolved market_signal outcomes for this strategy, last 30 days — the primary evidence for multi-symbol strategies."
          >
            <SimpleTable
              columns={["Symbol", "Signals", "Win Rate", "Avg Pips"]}
              emptyMessage="No signals for this strategy in the last 30 days."
              rows={symbolPerformance.byVolume.map((s) => [
                s.symbol,
                s.signals,
                s.winRate !== null ? formatPercent(s.winRate) : "—",
                s.avgPips !== null ? s.avgPips.toFixed(1) : "—",
              ])}
            />
          </SectionCard>

          <SectionCard
            title={`Potential Updates (${confirmedExperiments.length})`}
            description="Confirmed hypotheses, validated but not yet applied to the live strategy."
          >
            {confirmedExperiments.length === 0 ? (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
                Nothing confirmed yet.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {confirmedExperiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>
                        {exp.hypothesis}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        {exp.source.replace(/_/g, " ")} · confirmed {formatDate(exp.decidedAt ?? exp.createdAt)}
                      </p>
                      <PromotionCheckNote promotion={exp.promotion} />
                    </div>
                    {exp.promotion?.verdict === "promote" && (
                      <PromoteButton
                        strategyId={strategy.id}
                        strategyName={strategy.name}
                        experimentId={exp.id}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Experiments"
            description="Every tuning hypothesis logged for this strategy — query-derived, backtest-derived, or a manual trading observation."
          >
            {experiments.length === 0 ? (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--muted-foreground)" }}>
                No experiments logged yet.
              </p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Hypothesis", "Source", "Status", "Created", ""].map((c) => (
                      <th
                        key={c}
                        className="text-left px-4 py-2.5 font-medium tracking-wider uppercase text-[10px]"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp) => (
                    <ExperimentRow key={exp.id} strategyId={strategy.id} experiment={exp} />
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
