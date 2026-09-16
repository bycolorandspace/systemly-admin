interface InvalidEvidenceBadgeProps {
  reason: string | null;
}

/**
 * Marks a backtest or tuning experiment whose result must not be used for
 * decisions. The full reason shows on hover.
 */
export function InvalidEvidenceBadge({ reason }: InvalidEvidenceBadgeProps) {
  return (
    <span
      className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded cursor-help"
      style={{ background: "var(--muted)", color: "var(--destructive)" }}
      title={reason ?? "Marked invalid evidence."}
    >
      invalid
    </span>
  );
}
