"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div className="text-xs px-3 py-2 rounded-md"
      style={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
      <p style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <p className="font-semibold metric-number" style={{ color: val >= 50 ? "var(--success)" : "var(--destructive)" }}>
        {val !== null ? `${val.toFixed(1)}%` : "—"}
      </p>
    </div>
  );
};

export function WinRateChart({ data }: { data: { date: string; winRate: number | null }[] }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}>
        Win Rate Trend (7-day rolling)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false} axisLine={false} interval={4} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="winRate" stroke="var(--success)"
            strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
