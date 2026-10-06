import { answerLabel, planLabel, QUESTION_SHORT, isQuestionKey } from "@/lib/feedback-labels";
import type { TextEntry } from "@/lib/feedback-stats";
import { formatDate } from "@/lib/utils";
import { EmptyLine } from "./feedback-section";

/**
 * Free text written by users. Rendered as a plain React text node: never as
 * HTML or markdown, and never turned into links, so a pasted URL stays inert.
 */
export function FeedbackTextList({
  entries,
  emptyMessage,
  showAnswer = false,
}: {
  entries: TextEntry[];
  emptyMessage: string;
  showAnswer?: boolean;
}) {
  if (entries.length === 0) return <EmptyLine>{emptyMessage}</EmptyLine>;
  return (
    <ul className="max-h-96 overflow-auto">
      {entries.map((e) => (
        <li
          key={e.id}
          className="px-6 py-3 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="text-sm whitespace-pre-wrap break-words"
            style={{ color: "var(--foreground)" }}
          >
            {e.text}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            {planLabel(e.plan)}
            {e.isTrial ? " (trial)" : ""}
            {showAnswer && e.answerOption ? ` · ${answerLabel(e.answerOption)}` : ""}
            {e.scheduledKey && isQuestionKey(e.scheduledKey)
              ? ` · replaced ${QUESTION_SHORT[e.scheduledKey]}`
              : ""}
            {` · ${formatDate(e.createdAt)}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
