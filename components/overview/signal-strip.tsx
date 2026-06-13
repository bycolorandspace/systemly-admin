import { formatPercent } from "@/lib/utils";

interface SignalStripProps {
  data: {
    signalsToday: number;
    signalsLast7d: number;
    signalsLast30d: number;
    winRate: number | null;
    topSymbols: { sym: string; count: number }[];
    activeShares: number;
    totalViews: number;
    avgViewsPerShare: number;
    callsThisMonth: number;
  };
}

export function SignalStrip({ data }: SignalStripProps) {
  return (
    <div className="px-6 py-5" style={{ borderColor: "var(--border)" }}>
      <p className="text-[10px] tracking-widest uppercase mb-4" style={{ color: "var(--muted-foreground)" }}>
        Signals & AI Usage
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Today</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.signalsToday}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Last 7d</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.signalsLast7d}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Last 30d</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.signalsLast30d}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Win Rate</p>
          <p
            className="text-2xl font-bold metric-number"
            style={{
              color:
                data.winRate === null
                  ? "var(--muted-foreground)"
                  : data.winRate >= 60
                  ? "var(--success)"
                  : data.winRate >= 40
                  ? "var(--primary)"
                  : "var(--destructive)",
            }}
          >
            {data.winRate !== null ? formatPercent(data.winRate, 0) : "—"}
          </p>
        </div>

        {/* Top 3 symbols */}
        <div className="col-span-2">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>
            Top Symbols (30d)
          </p>
          {data.topSymbols.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>—</p>
          ) : (
            <div className="flex flex-col gap-1">
              {data.topSymbols.map(({ sym, count }, i) => (
                <div key={sym} className="flex items-center gap-2">
                  <span className="text-[10px] w-3" style={{ color: "var(--muted-foreground)" }}>
                    {i + 1}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{sym}</span>
                  <span className="text-xs metric-number" style={{ color: "var(--muted-foreground)" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Active Shares</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.activeShares}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Share Views</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.totalViews}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>Avg Reach</p>
          <p className="text-2xl font-bold metric-number" style={{ color: data.avgViewsPerShare > 0 ? "var(--success)" : "var(--muted-foreground)" }}>
            {data.avgViewsPerShare > 0 ? `${data.avgViewsPerShare}×` : "—"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--muted-foreground)" }}>AI Calls/mo</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--primary)" }}>
            {data.callsThisMonth}
          </p>
        </div>
      </div>
    </div>
  );
}
