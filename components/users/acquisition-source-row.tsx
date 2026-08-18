import { referralSourceColor } from "@/lib/referral-sources";

/**
 * The bar is scaled against the window's top source, not against 100%, so a
 * mix where nothing clears 20% still reads as a ranking rather than as a row
 * of stubs. The percentage label carries the true share.
 */
export function AcquisitionSourceRow({
  source,
  count,
  pct,
  maxCount,
}: {
  source: string;
  count: number;
  pct: number;
  maxCount: number;
}) {
  const color = referralSourceColor(source);
  const width = maxCount > 0 ? (count / maxCount) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color }}
      />
      <span
        className="text-xs truncate w-32 sm:w-44 flex-shrink-0"
        style={{ color: "var(--foreground)" }}
        title={source}
      >
        {source}
      </span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden min-w-8"
        style={{ background: "var(--muted)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${width}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-medium metric-number w-7 text-right flex-shrink-0"
        style={{ color: "var(--foreground)" }}
      >
        {count}
      </span>
      <span
        className="text-xs metric-number w-11 text-right flex-shrink-0"
        style={{ color: "var(--muted-foreground)" }}
      >
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
