import { answerLabel, PLANS, planLabel } from "@/lib/feedback-labels";
import type { DistributionRow } from "@/lib/feedback-stats";
import { formatPercent } from "@/lib/utils";
import { TH_CLASS, EmptyLine } from "./feedback-section";

/**
 * Answer counts per plan, with each answer's share of everything answered.
 * A table rather than a chart: five rows by four plans reads faster as numbers,
 * and the bar in the share column carries the comparison.
 */
export function FeedbackDistributionTable({
  rows,
  total,
}: {
  rows: DistributionRow[];
  total: number;
}) {
  if (total === 0) return <EmptyLine>No answers yet.</EmptyLine>;
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th className={TH_CLASS} style={{ color: "var(--muted-foreground)" }}>Answer</th>
            {PLANS.map((p) => (
              <th key={p} className={`${TH_CLASS} text-right`} style={{ color: "var(--muted-foreground)" }}>
                {planLabel(p)}
              </th>
            ))}
            <th className={`${TH_CLASS} text-right`} style={{ color: "var(--muted-foreground)" }}>Total</th>
            <th className={TH_CLASS} style={{ color: "var(--muted-foreground)" }}>
              Share of {total.toLocaleString()} answers
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const share = (r.byPlan.total / total) * 100;
            return (
              <tr key={r.value} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3" style={{ color: "var(--foreground)" }}>
                  {answerLabel(r.value)}
                </td>
                {PLANS.map((p) => (
                  <td key={p} className="px-6 py-3 text-right metric-number" style={{ color: "var(--muted-foreground)" }}>
                    {r.byPlan[p]}
                  </td>
                ))}
                <td className="px-6 py-3 text-right font-semibold metric-number" style={{ color: "var(--foreground)" }}>
                  {r.byPlan.total}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-28 rounded-full" style={{ background: "var(--secondary)" }}>
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${share}%`, background: "var(--primary)" }}
                      />
                    </div>
                    <span className="metric-number" style={{ color: "var(--muted-foreground)" }}>
                      {formatPercent(share)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
