import type { FlaggedBacktest } from "@/lib/queries/tuning";
import { formatDate } from "@/lib/utils";

interface LeakFlaggedBacktestsProps {
  backtests: FlaggedBacktest[];
}

/**
 * Backtests whose win rate beats chance at their own target distances by more
 * than the threshold. That is the signature the April look-ahead left, so any
 * row here needs a leak review before its profit factor is read.
 */
export function LeakFlaggedBacktests({ backtests }: LeakFlaggedBacktestsProps) {
  return (
    <section>
      <p
        className="text-[10px] tracking-widest uppercase mb-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        Backtests flagged for leak review ({backtests.length})
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        Win rate more than 10 points above what chance gives at the same stop and target
        distances, on at least 20 resolved trades. Check the run for look-ahead before
        reading its profit factor.
      </p>
      {backtests.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Nothing flagged.
        </p>
      ) : (
        <div className="border rounded-lg overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Backtest", "Symbol", "TF", "Vs chance", "Resolved", "Strategy", "User", "Created"].map((c) => (
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
              {backtests.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--foreground)" }}>
                    {b.label ?? b.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{b.symbol}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{b.primaryTimeframe}</td>
                  <td className="px-4 py-3 metric-number" style={{ color: "var(--destructive)" }}>
                    {b.leakReview.excessPts !== null ? `+${b.leakReview.excessPts.toFixed(1)} pts` : "—"}
                  </td>
                  <td className="px-4 py-3 metric-number" style={{ color: "var(--muted-foreground)" }}>
                    {b.leakReview.resolvedTrades}
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--muted-foreground)" }}>
                    {b.strategyId ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ color: "var(--muted-foreground)" }}>
                    {b.userId ? b.userId.slice(0, 8) : "—"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                    {formatDate(b.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
