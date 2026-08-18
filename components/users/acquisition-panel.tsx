"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AcquisitionBreakdown } from "@/lib/queries/users";
import { AcquisitionSourceRow } from "./acquisition-source-row";

const WINDOWS = [
  { key: "d7", label: "7d" },
  { key: "d30", label: "30d" },
  { key: "all", label: "All" },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

export function AcquisitionPanel({ data }: { data: AcquisitionBreakdown }) {
  const [windowKey, setWindowKey] = useState<WindowKey>("d7");
  const active = data[windowKey];
  const maxCount = active.sources[0]?.count ?? 0;
  const top = active.sources[0] ?? null;
  const answerRate =
    active.signups > 0 ? (active.answered / active.signups) * 100 : 0;

  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p
            className="text-[10px] tracking-widest uppercase"
            style={{ color: "var(--muted-foreground)" }}
          >
            Acquisition
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Self-reported on the last onboarding step. No country is collected.
          </p>
        </div>

        <div
          className="flex rounded-md overflow-hidden border flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {WINDOWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setWindowKey(key)}
              className={cn(
                "px-3 py-1.5 text-xs transition-colors",
                windowKey === key ? "font-medium" : "hover:bg-accent"
              )}
              style={{
                background: windowKey === key ? "var(--accent)" : undefined,
                color:
                  windowKey === key
                    ? "var(--foreground)"
                    : "var(--muted-foreground)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[repeat(3,minmax(0,140px))_1fr] gap-6">
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            New signups
          </p>
          <p
            className="text-2xl font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {active.signups.toLocaleString()}
          </p>
        </div>

        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Answered
          </p>
          <p
            className="text-2xl font-bold metric-number"
            style={{ color: "var(--foreground)" }}
          >
            {active.answered.toLocaleString()}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {answerRate.toFixed(0)}% of signups
          </p>
        </div>

        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-1"
            style={{ color: "var(--muted-foreground)" }}
          >
            Top source
          </p>
          <p
            className="text-sm font-medium leading-tight"
            style={{ color: "var(--foreground)" }}
          >
            {top ? top.source : "—"}
          </p>
          {top && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {top.count} users, {top.pct.toFixed(0)}%
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 justify-center">
          {active.sources.length > 0 ? (
            <>
              {active.sources.map((s) => (
                <AcquisitionSourceRow
                  key={s.source}
                  source={s.source}
                  count={s.count}
                  pct={s.pct}
                  maxCount={maxCount}
                />
              ))}
              {active.unanswered > 0 && (
                <p
                  className="text-[11px] mt-1"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {active.unanswered} signup{active.unanswered === 1 ? "" : "s"} did
                  not reach the question, and are excluded from the percentages.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              No answers in this window.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
