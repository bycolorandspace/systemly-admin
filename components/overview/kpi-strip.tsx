import { formatGBP, formatPercent } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiStripProps {
  mrr: number;
  totalCosts: number;
  profit: number;
  margin: number;
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "red" | "amber" | "default";
}) {
  const colorMap = {
    green: "var(--success)",
    red: "var(--destructive)",
    amber: "var(--primary)",
    default: "var(--foreground)",
  };

  return (
    <div
      className="flex-1 px-6 py-5 border-r last:border-r-0"
      style={{ borderColor: "var(--border)" }}
    >
      <p
        className="text-[10px] font-medium tracking-widest uppercase mb-2"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </p>
      <p
        className="text-4xl font-bold tracking-tight metric-number"
        style={{ color: colorMap[color] }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export function KpiStrip({ mrr, totalCosts, profit, margin }: KpiStripProps) {
  const isProfit = profit >= 0;

  return (
    <div
      className="flex border-b"
      style={{ borderColor: "var(--border)", background: "var(--card)" }}
    >
      <KpiCard
        label="MRR"
        value={formatGBP(mrr)}
        sub="+12% MoM target"
        color="green"
      />
      <KpiCard
        label="Monthly Costs"
        value={formatGBP(totalCosts)}
        color="red"
      />
      <KpiCard
        label={isProfit ? "Profit" : "Loss"}
        value={formatGBP(Math.abs(profit))}
        color={isProfit ? "green" : "red"}
      />
      <KpiCard
        label="Margin"
        value={formatPercent(margin)}
        color={margin >= 0 ? "green" : "red"}
      />
    </div>
  );
}
