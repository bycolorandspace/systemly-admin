interface FunnelRowProps {
  label: string;
  value: number;
  /** The step above this one. The bar and the drop-off are both relative to it. */
  previous: number;
  /** The top of the funnel, so every bar shares one scale. */
  total: number;
}

/**
 * One step of a funnel: the count, its share of the top, and what was lost
 * since the step above.
 *
 * The drop-off is shown against the previous step rather than the total,
 * because that is the number that names a specific screen as the problem. A
 * step at 20% of signups tells you the funnel is bad; a step that loses 60% of
 * the people who reached the one before it tells you where.
 */
export function FunnelRow({ label, value, previous, total }: FunnelRowProps) {
  const pctOfTotal = total > 0 ? (value / total) * 100 : 0;
  const dropped = Math.max(previous - value, 0);
  const dropPct = previous > 0 ? (dropped / previous) * 100 : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs" style={{ color: "var(--foreground)" }}>
          {label}
        </span>
        <span className="flex items-baseline gap-2">
          <span
            className="text-sm font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {value.toLocaleString()}
          </span>
          <span
            className="text-[10px] metric-number"
            style={{ color: "var(--muted-foreground)" }}
          >
            {pctOfTotal.toFixed(0)}%
          </span>
        </span>
      </div>

      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pctOfTotal, 100)}%`,
            background: "var(--primary, #a855f7)",
          }}
        />
      </div>

      {dropped > 0 && (
        <p
          className="text-[10px] metric-number"
          style={{ color: "var(--destructive, #ef4444)" }}
        >
          -{dropped.toLocaleString()} ({dropPct.toFixed(0)}% lost here)
        </p>
      )}
    </div>
  );
}
