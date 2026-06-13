import { formatGBP, formatPercent } from "@/lib/utils";

interface RevenueStreamsProps {
  mrrFromStripe: number;
  trialCount: number;
  newPaidThisMonth: number;
  arpu: number;
  churnedLast30d: number;
  tierCounts: Record<string, number>;
}

const TIER_COLORS: Record<string, string> = {
  starter: "#3b82f6",
  plus: "#a855f7",
  pro: "#f59e0b",
};

export function RevenueStreams({
  mrrFromStripe,
  trialCount,
  newPaidThisMonth,
  arpu,
  churnedLast30d,
  tierCounts,
}: RevenueStreamsProps) {
  const totalPaid = Object.values(tierCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex-1 border-r" style={{ borderColor: "var(--border)" }}>
      <div
        className="px-6 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-xs" style={{ color: "var(--primary)" }}>£</span>
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--foreground)" }}
        >
          Revenue Streams
        </span>
      </div>

      {/* SaaS Subscriptions row */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: mrrFromStripe > 0 ? "var(--success)" : "var(--border)" }}
          />
          <div>
            <p className="text-sm" style={{ color: "var(--foreground)" }}>
              SaaS Subscriptions
            </p>
            <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
              £50,000/mo target
            </p>
          </div>
        </div>
        <span
          className="text-sm font-semibold metric-number"
          style={{ color: mrrFromStripe > 0 ? "var(--success)" : "var(--muted-foreground)" }}
        >
          {formatGBP(mrrFromStripe)}
        </span>
      </div>

      {/* Tier breakdown */}
      <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <p
          className="text-[10px] tracking-widest uppercase mb-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          Active Subscriptions by Tier
        </p>
        <div className="space-y-2">
          {(["starter", "plus", "pro"] as const).map((tier) => {
            const count = tierCounts[tier] ?? 0;
            const pct = totalPaid > 0 ? (count / totalPaid) * 100 : 0;
            return (
              <div key={tier} className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: TIER_COLORS[tier] }}
                />
                <span
                  className="text-xs capitalize w-12"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {tier}
                </span>
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: TIER_COLORS[tier] }}
                  />
                </div>
                <span
                  className="text-xs font-semibold metric-number w-6 text-right"
                  style={{ color: "var(--foreground)" }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="px-6 py-4">
        <p
          className="text-[10px] tracking-widest uppercase mb-3"
          style={{ color: "var(--muted-foreground)" }}
        >
          Conversion Funnel
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            { label: "On Trial", value: String(trialCount), color: "var(--primary)" },
            { label: "New Paid (mo)", value: String(newPaidThisMonth), color: "var(--success)" },
            { label: "ARPU", value: formatGBP(arpu), color: "var(--foreground)" },
            { label: "Churned (30d)", value: String(churnedLast30d), color: churnedLast30d > 0 ? "var(--destructive)" : "var(--muted-foreground)" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                {label}
              </p>
              <p className="text-lg font-bold metric-number" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
