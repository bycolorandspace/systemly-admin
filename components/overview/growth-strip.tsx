interface GrowthData {
  totalUsers: number;
  newLast7d: number;
  newLast30d: number;
  tierDist: Record<string, number>;
  dau: number;
  wau: number;
  mau: number;
}

const TIER_COLORS: Record<string, string> = {
  free: "#71717a",
  starter: "#3b82f6",
  plus: "#a855f7",
  pro: "#f59e0b",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
};

export function GrowthStrip({ data }: { data: GrowthData }) {
  const tierOrder = ["free", "starter", "plus", "pro"];
  const totalTierUsers = Object.values(data.tierDist).reduce((a, b) => a + b, 0);

  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <p className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}>
        Growth
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>Total Users</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.totalUsers.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>New 7d</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--success)" }}>
            +{data.newLast7d}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>New 30d</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--success)" }}>
            +{data.newLast30d}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>DAU</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.dau}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>WAU</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.wau}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}>MAU</p>
          <p className="text-2xl font-bold metric-number" style={{ color: "var(--foreground)" }}>
            {data.mau}
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] uppercase tracking-wider mb-2"
            style={{ color: "var(--muted-foreground)" }}>Tiers</p>
          <div className="flex flex-col gap-1">
            {tierOrder.map((tier) => {
              const count = data.tierDist[tier] ?? 0;
              const pct = totalTierUsers > 0 ? (count / totalTierUsers) * 100 : 0;
              return (
                <div key={tier} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: TIER_COLORS[tier] }}
                  />
                  <span className="text-xs w-12" style={{ color: "var(--muted-foreground)" }}>
                    {TIER_LABELS[tier]}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: TIER_COLORS[tier] }}
                    />
                  </div>
                  <span className="text-xs font-medium metric-number w-6 text-right"
                    style={{ color: "var(--foreground)" }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
