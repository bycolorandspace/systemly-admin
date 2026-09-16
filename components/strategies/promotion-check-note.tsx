import type { PromotionCheckSummary } from "@/lib/queries/tuning";
import { PROMOTION_VERDICT_LABEL, formatFailedChecks } from "@/lib/tuning-labels";

interface PromotionCheckNoteProps {
  promotion: PromotionCheckSummary | null;
}

/**
 * The held-out-months check under a potential update. Promotion is only
 * offered when the verdict is "promote"; anything else says why it is held.
 */
export function PromotionCheckNote({ promotion }: PromotionCheckNoteProps) {
  if (!promotion) {
    return (
      <p className="text-xs mt-1" style={{ color: "var(--destructive)" }}>
        Can&apos;t promote: no held-out check recorded. Run the tuning script&apos;s held-out
        evaluation first.
      </p>
    );
  }

  const passed = promotion.verdict === "promote";
  return (
    <p
      className="text-xs mt-1"
      style={{ color: passed ? "var(--success)" : "var(--destructive)" }}
    >
      {PROMOTION_VERDICT_LABEL[promotion.verdict] ?? promotion.verdict}
      {!passed && promotion.failedChecks.length > 0 && (
        <> · failed: {formatFailedChecks(promotion.failedChecks)}</>
      )}
    </p>
  );
}
