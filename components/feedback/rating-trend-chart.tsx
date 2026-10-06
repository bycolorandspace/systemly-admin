"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyRating } from "@/lib/feedback-stats";
import { formatShortDate } from "@/lib/utils";

interface TipProps {
  active?: boolean;
  payload?: { payload: WeeklyRating }[];
}

function Tip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div
      className="text-xs px-3 py-2 rounded-md"
      style={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      <p style={{ color: "var(--muted-foreground)" }}>Week of {formatShortDate(p.week)}</p>
      <p className="font-semibold metric-number">
        {p.average.toFixed(2)} average, n = {p.n}
      </p>
    </div>
  );
}

/** Weekly average rating, 1 to 5. A chart because the question is the direction over time. */
export function RatingTrendChart({ data }: { data: WeeklyRating[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="week"
          tickFormatter={(w: string) => formatShortDate(w)}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<Tip />} />
        <Line
          type="monotone"
          dataKey="average"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--primary)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
