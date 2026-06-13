"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-3 py-2 rounded-md"
      style={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
      <p style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <p className="font-semibold metric-number">{payload[0]?.value} signals</p>
    </div>
  );
};

export function SignalVolumeChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}>
        Signal Volume (30 days)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent)" }} />
          <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
