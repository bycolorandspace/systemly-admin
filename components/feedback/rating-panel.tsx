import type { FeedbackOverview } from "@/lib/feedback-stats";
import { EmptyLine, FeedbackSection } from "./feedback-section";
import { RatingTrendChart } from "./rating-trend-chart";

export function RatingPanel({ rating }: { rating: FeedbackOverview["rating"] }) {
  const max = Math.max(1, ...rating.distribution.map((d) => d.count));
  return (
    <FeedbackSection title="Rating" note="Every response carries a 1 to 5 rating, whatever the question.">
      {rating.n === 0 || rating.average === null ? (
        <EmptyLine>No ratings yet.</EmptyLine>
      ) : (
        <div className="px-6 pb-5 grid grid-cols-1 lg:grid-cols-[220px_1fr_1fr] gap-6 items-start">
          <div>
            <p className="text-3xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
              {rating.average.toFixed(2)}
              <span className="text-sm font-normal" style={{ color: "var(--muted-foreground)" }}> / 5</span>
            </p>
            <p className="text-xs mt-1 metric-number" style={{ color: "var(--muted-foreground)" }}>
              average over n = {rating.n.toLocaleString()} ratings
            </p>
          </div>
          <div className="space-y-1.5">
            {rating.distribution.map((d) => (
              <div key={d.rating} className="flex items-center gap-2 text-xs">
                <span className="w-10 metric-number" style={{ color: "var(--muted-foreground)" }}>
                  {d.rating} star{d.rating === 1 ? "" : "s"}
                </span>
                <div className="h-1.5 flex-1 rounded-full" style={{ background: "var(--secondary)" }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${(d.count / max) * 100}%`, background: "var(--primary)" }}
                  />
                </div>
                <span className="w-8 text-right metric-number" style={{ color: "var(--foreground)" }}>
                  {d.count}
                </span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
              Weekly average
            </p>
            {rating.weekly.length < 2 ? (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                A trend needs at least two weeks of ratings.
              </p>
            ) : (
              <RatingTrendChart data={rating.weekly} />
            )}
          </div>
        </div>
      )}
    </FeedbackSection>
  );
}
