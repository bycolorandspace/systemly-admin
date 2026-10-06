import { QUESTION_SHORT } from "@/lib/feedback-labels";
import type { SendRow } from "@/lib/feedback-stats";
import { FeedbackSection } from "./feedback-section";

/**
 * Response-rate signal. These are answers received per question in the last 30
 * days; unanswered prompts are not stored, so this counts answers, not asks.
 */
export function SendsPanel({ sends }: { sends: SendRow[] }) {
  return (
    <FeedbackSection
      title="Responses per question (30 days)"
      note="Counts answers received. Prompts shown but not answered are not recorded. 'Replaced' counts what-went-wrong answers that took this question's slot."
    >
      <div className="grid grid-cols-2 md:grid-cols-5 divide-x border-t" style={{ borderColor: "var(--border)" }}>
        {sends.map((s) => (
          <div key={s.question} className="px-6 py-4">
            <p className="text-[10px] tracking-widest uppercase mb-1" style={{ color: "var(--muted-foreground)" }}>
              {QUESTION_SHORT[s.question]}
            </p>
            <p className="text-xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
              {s.last30.toLocaleString()}
            </p>
            {s.question !== "what_went_wrong" && (
              <p className="text-[11px] mt-0.5 metric-number" style={{ color: "var(--muted-foreground)" }}>
                {s.replacedLast30} replaced
              </p>
            )}
          </div>
        ))}
      </div>
    </FeedbackSection>
  );
}
