"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MrrChartProps {
  data: { date: string; mrr: number; starter: number; plus: number; pro: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-md shadow-lg"
      style={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      <p className="font-semibold mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium metric-number">£{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function MrrChart({ data }: MrrChartProps) {
  return (
    <div className="px-6 py-5">
      <p className="text-[10px] tracking-widest uppercase mb-4"
        style={{ color: "var(--muted-foreground)" }}>
        MRR Trend (30 days)
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="starterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="plusGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `£${v}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }}
            formatter={(value) => <span style={{ color: "var(--muted-foreground)" }}>{value}</span>}
          />
          <Area type="monotone" dataKey="starter" name="Starter" stackId="1"
            stroke="#3b82f6" fill="url(#starterGrad)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="plus" name="Plus" stackId="1"
            stroke="#a855f7" fill="url(#plusGrad)" strokeWidth={1.5} dot={false} />
          <Area type="monotone" dataKey="pro" name="Pro" stackId="1"
            stroke="#f59e0b" fill="url(#proGrad)" strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
