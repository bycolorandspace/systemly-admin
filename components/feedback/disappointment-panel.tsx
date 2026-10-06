import {
  MIN_SAMPLE,
  planLabel,
  SEAN_ELLIS_BENCHMARK,
} from "@/lib/feedback-labels";
import type { DisappointmentSlice } from "@/lib/feedback-stats";
import { formatPercent } from "@/lib/utils";
import { EmptyLine, FeedbackSection, TH_CLASS } from "./feedback-section";

function pct(s: DisappointmentSlice): number | null {
  return s.n === 0 ? null : (s.veryDisappointed / s.n) * 100;
}

/** The 40% line drawn over a 0 to 100 track, so every bar shares one scale. */
function Track({ value }: { value: number | null }) {
  return (
    <div className="relative h-1.5 w-40 rounded-full" style={{ background: "var(--secondary)" }}>
      {value !== null && (
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${Math.min(100, value)}%`,
            background: value >= SEAN_ELLIS_BENCHMARK ? "var(--success)" : "var(--primary)",
          }}
        />
      )}
      <div
        className="absolute -top-1 h-3.5 w-px"
        style={{ left: `${SEAN_ELLIS_BENCHMARK}%`, background: "var(--foreground)" }}
        aria-hidden
      />
    </div>
  );
}

function SliceTable({ title, rows, labelFn }: {
  title: string;
  rows: DisappointmentSlice[];
  labelFn: (s: DisappointmentSlice) => string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="px-6 py-2 text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
        {title}
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
            <th className={TH_CLASS} style={{ color: "var(--muted-foreground)" }}>Group</th>
            <th className={`${TH_CLASS} text-right`} style={{ color: "var(--muted-foreground)" }}>People</th>
            <th className={TH_CLASS} style={{ color: "var(--muted-foreground)" }}>Very disappointed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const p = pct(s);
            const low = s.n < MIN_SAMPLE;
            return (
              <tr key={s.key} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-6 py-3" style={{ color: "var(--foreground)" }}>{labelFn(s)}</td>
                <td className="px-6 py-3 text-right metric-number" style={{ color: "var(--muted-foreground)" }}>
                  n = {s.n}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Track value={p} />
                    <span className="metric-number w-24" style={{ color: "var(--foreground)" }}>
                      {p === null ? "No answers" : `${formatPercent(p)} (n = ${s.n})`}
                    </span>
                    {low && s.n > 0 && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                        style={{ border: "1px solid var(--border)", color: "var(--primary)" }}
                      >
                        Low sample
                      </span>
                    )}
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

/**
 * Sean Ellis product-market-fit test: the share who would be very disappointed
 * to lose Systemly, against the 40% line. Every percentage carries its n, and
 * under 30 people it is flagged in words as well as colour.
 */
export function DisappointmentPanel({
  overall,
  byJob,
  byPlan,
}: {
  overall: DisappointmentSlice;
  byJob: DisappointmentSlice[];
  byPlan: DisappointmentSlice[];
}) {
  const p = pct(overall);
  const low = overall.n < MIN_SAMPLE;
  return (
    <FeedbackSection
      title="Disappointment: product-market-fit test"
      note={`Share answering "very disappointed". The line is the ${SEAN_ELLIS_BENCHMARK}% benchmark. Each person counts once, by their latest answer.`}
    >
      {p === null ? (
        <EmptyLine>No disappointment answers yet.</EmptyLine>
      ) : (
        <>
          <div className="px-6 pb-5 flex items-end gap-6 flex-wrap">
            <div>
              <p className="text-3xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
                {formatPercent(p)}
              </p>
              <p className="text-xs mt-1 metric-number" style={{ color: "var(--muted-foreground)" }}>
                {overall.veryDisappointed} of n = {overall.n} people
              </p>
            </div>
            <div className="pb-1">
              <Track value={p} />
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                {p >= SEAN_ELLIS_BENCHMARK
                  ? `At or above the ${SEAN_ELLIS_BENCHMARK}% benchmark`
                  : `Below the ${SEAN_ELLIS_BENCHMARK}% benchmark`}
                {low && ` · fewer than ${MIN_SAMPLE} people, read as direction only`}
              </p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row lg:divide-x pb-2" style={{ borderColor: "var(--border)" }}>
            <SliceTable title="By job answer" rows={byJob} labelFn={(s) => s.label} />
            <SliceTable title="By plan" rows={byPlan} labelFn={(s) => planLabel(s.label)} />
          </div>
        </>
      )}
    </FeedbackSection>
  );
}
