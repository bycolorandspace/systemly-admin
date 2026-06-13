"use client";

import { useState } from "react";

interface PingResult {
  url: string;
  reachable: boolean;
  statusCode?: number;
  error?: string;
}

interface CronJob {
  label: string;
  description: string;
  path: string;
  body?: Record<string, unknown>;
}

const CRON_JOBS: CronJob[] = [
  {
    label: "Generate Strategy Signals",
    description: "Scan all user strategies with is_scanning = true",
    path: "/api/signals/generate-strategy",
  },
  {
    label: "Generate Community Signals",
    description: "Run the Balanced Default strategy across community symbols",
    path: "/api/signals/generate-community",
  },
  {
    label: "Check Signal Outcomes",
    description: "Sweep open community + strategy signals for TP/SL hits",
    path: "/api/signals/check-outcomes",
  },
  {
    label: "Check Price Alerts",
    description: "Evaluate user price alerts against latest quotes",
    path: "/api/alert/check-price",
  },
  {
    label: "Sync MT5 History",
    description: "Pull broker-confirmed deals into trade_executions",
    path: "/api/mt5/sync-history",
  },
  {
    label: "Affiliate Qualification Sweep",
    description: "Qualify pending referrals and grant earned rewards",
    path: "/api/cron/affiliates-qualify",
  },
];

interface RunResult {
  ok: boolean;
  status: number;
  elapsedMs?: number;
  body?: unknown;
  error?: string;
}

export function CronTriggerCard({ job }: { job: CronJob }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/run-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: job.path, body: job.body }),
      });
      const data = (await res.json()) as RunResult;
      setResult(data);
    } catch (err) {
      setResult({
        ok: false,
        status: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-5 rounded-lg"
      style={{ border: "1px solid var(--border)", background: "var(--card)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {job.label}
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--muted-foreground)" }}
          >
            {job.description}
          </p>
          <p
            className="text-[10px] font-mono mt-2"
            style={{ color: "var(--muted-foreground)" }}
          >
            POST {job.path}
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 shrink-0"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          {loading ? "Running…" : "Run now"}
        </button>
      </div>

      {result && (
        <div
          className="mt-3 p-3 rounded-md"
          style={{
            background: "var(--muted)",
            border: `1px solid ${
              result.ok ? "var(--success)" : "var(--destructive)"
            }`,
          }}
        >
          <p
            className="text-[10px] font-semibold tracking-wider uppercase mb-1"
            style={{
              color: result.ok ? "var(--success)" : "var(--destructive)",
            }}
          >
            {result.ok ? "Success" : "Failed"} · HTTP {result.status}
            {result.elapsedMs !== undefined && ` · ${result.elapsedMs}ms`}
          </p>
          <pre
            className="text-[11px] font-mono overflow-auto max-h-60"
            style={{ color: "var(--muted-foreground)" }}
          >
            {JSON.stringify(result.body ?? result.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function CronTriggerList({ mainAppUrl }: { mainAppUrl: string }) {
  const [pinging, setPinging] = useState(false);
  const [ping, setPing] = useState<PingResult | null>(null);

  const testConnection = async () => {
    setPinging(true);
    setPing(null);
    try {
      const res = await fetch("/api/admin/run-cron");
      const data = (await res.json()) as PingResult;
      setPing(data);
    } catch (err) {
      setPing({ url: mainAppUrl, reachable: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
          {mainAppUrl}
        </span>
        <button
          onClick={testConnection}
          disabled={pinging}
          className="px-2 py-0.5 rounded text-[11px] font-semibold disabled:opacity-50"
          style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          {pinging ? "Pinging…" : "Test connection"}
        </button>
        {ping && (
          <span
            className="text-[11px] font-semibold"
            style={{ color: ping.reachable ? "var(--success)" : "var(--destructive)" }}
          >
            {ping.reachable ? `Reachable (HTTP ${ping.statusCode})` : `Unreachable — ${ping.error}`}
          </span>
        )}
      </div>
      {CRON_JOBS.map((job) => (
        <CronTriggerCard key={job.path} job={job} />
      ))}
    </div>
  );
}
