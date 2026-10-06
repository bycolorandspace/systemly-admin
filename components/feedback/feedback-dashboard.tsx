import type { FeedbackOverview } from "@/lib/feedback-stats";
import { DisappointmentPanel } from "./disappointment-panel";
import { FeedbackDistributionTable } from "./feedback-distribution-table";
import { FeedbackSection } from "./feedback-section";
import { FeedbackTextList } from "./feedback-text-list";
import { RatingPanel } from "./rating-panel";
import { ResponseList } from "./response-list";
import { SendsPanel } from "./sends-panel";

/** Composes the feedback page from one overview read. */
export function FeedbackDashboard({ overview }: { overview: FeedbackOverview }) {
  const empty = overview.totalRows === 0;
  return (
    <div className="flex-1 overflow-auto">
      {empty && (
        <p
          className="px-6 py-4 text-sm border-b"
          style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}
        >
          No feedback has been sent yet. Every section below fills in as users answer.
        </p>
      )}
      {overview.truncated && (
        <p
          className="px-6 py-3 text-xs border-b"
          style={{ color: "var(--primary)", borderColor: "var(--border)" }}
        >
          Summaries cover the newest {overview.totalRows.toLocaleString()} responses only.
        </p>
      )}

      <SendsPanel sends={overview.sends} />

      <FeedbackSection title="Job: why people came" note="Answer counts, split by the plan on the answer.">
        <FeedbackDistributionTable rows={overview.job.rows} total={overview.job.total} />
      </FeedbackSection>

      <DisappointmentPanel {...overview.disappointment} />

      <FeedbackSection title="Build next: requests, newest first">
        <FeedbackTextList entries={overview.buildNext} emptyMessage="No requests yet." />
      </FeedbackSection>

      <FeedbackSection title="What went wrong">
        <FeedbackDistributionTable rows={overview.wentWrong.rows} total={overview.wentWrong.total} />
        {overview.wentWrong.total > 0 && (
          <FeedbackTextList
            entries={overview.wentWrong.texts}
            emptyMessage="No written explanations yet."
            showAnswer
          />
        )}
      </FeedbackSection>

      <RatingPanel rating={overview.rating} />

      <ResponseList />
    </div>
  );
}
