"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

interface ServiceUsage {
  service: string;
  used: number | null;
  limit: number | null;
  unit: string;
  billingUrl: string;
  autoFetched: boolean;
  error?: string;
}

interface UsageData {
  autoServices: ServiceUsage[];
  manualServices: ServiceUsage[];
  fetchedAt: string;
}

function UsageBar({ used, limit }: { used: number | null; limit: number | null }) {
  if (used === null || limit === null || limit === 0) return null;
  const pct = Math.min((used / limit) * 100, 100);
  const color = pct >= 100 ? "var(--destructive)" : pct >= 80 ? "#f59e0b" : "var(--primary)";
  return (
    <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: "var(--muted)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function daysToLimit(used: number | null, limit: number | null, unit: string): string | null {
  if (used === null || limit === null || limit === 0 || used === 0) return null;
  if (!unit.includes("/day")) return null;
  const remaining = limit - used;
  if (remaining <= 0) return "At limit";
  return `~${Math.floor(remaining / (used || 1))}d left`;
}

function AutoServiceRow({ svc }: { svc: ServiceUsage }) {
  const pct = svc.used !== null && svc.limit ? Math.min((svc.used / svc.limit) * 100, 100) : null;
  const statusColor = pct === null ? "var(--muted-foreground)" : pct >= 100 ? "var(--destructive)" : pct >= 80 ? "#f59e0b" : "var(--success)";
  const days = daysToLimit(svc.used, svc.limit, svc.unit);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide shrink-0"
            style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}
          >
            AUTO
          </span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
            {svc.service}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {days && (
            <span className="text-[10px]" style={{ color: statusColor }}>
              {days}
            </span>
          )}
          <span className="text-xs metric-number" style={{ color: "var(--foreground)" }}>
            {svc.used !== null ? svc.used.toLocaleString() : "—"}
            {svc.limit !== null ? ` / ${svc.limit.toLocaleString()}` : ""}
          </span>
          <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
            {svc.unit}
          </span>
          <a
            href={svc.billingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </a>
        </div>
      </div>
      {svc.error && (
        <p className="text-[10px] mt-1" style={{ color: "var(--destructive)" }}>
          {svc.error.slice(0, 80)}
        </p>
      )}
      {svc.used !== null && <UsageBar used={svc.used} limit={svc.limit} />}
    </div>
  );
}

function ManualServiceRow({
  svc,
  onSave,
}: {
  svc: ServiceUsage;
  onSave: (service: string, used: number) => Promise<void>;
}) {
  const [localUsed, setLocalUsed] = useState<string>(svc.used !== null ? String(svc.used) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const val = Number(localUsed);
    if (isNaN(val)) return;
    setSaving(true);
    await onSave(svc.service, val);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const numUsed = localUsed !== "" ? Number(localUsed) : null;
  const pct = numUsed !== null && svc.limit ? Math.min((numUsed / svc.limit) * 100, 100) : null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-wide shrink-0"
            style={{ background: "var(--secondary)", color: "var(--muted-foreground)", opacity: 0.7 }}
          >
            MANUAL
          </span>
          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
            {svc.service}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={localUsed}
            onChange={(e) => setLocalUsed(e.target.value)}
            placeholder="0"
            className="w-16 px-2 py-1 rounded text-xs text-right outline-none metric-number"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          {svc.limit !== null && (
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              / {svc.limit.toLocaleString()} {svc.unit}
            </span>
          )}
          {svc.limit === null && (
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {svc.unit}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="text-[10px] px-2 py-1 rounded disabled:opacity-50"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            {saving ? "…" : saved ? "✓" : "Set"}
          </button>
          <a href={svc.billingUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />
          </a>
        </div>
      </div>
      {pct !== null && <UsageBar used={numUsed} limit={svc.limit} />}
    </div>
  );
}

export function ServiceMonitor() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});

  async function load(bust = false) {
    const url = bust ? "/api/admin/service-usage?bust=1" : "/api/admin/service-usage";
    const res = await fetch(url);
    const json = await res.json();
    setData(json);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  async function saveManual(service: string, used: number) {
    setManualOverrides((prev) => ({ ...prev, [service]: used }));
    await fetch("/api/admin/set-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: `service_usage_manual_${service.toLowerCase().replace(/\s+/g, "_")}`, value: used }),
    });
  }

  const manualWithOverrides = (data?.manualServices ?? []).map((svc) => ({
    ...svc,
    used: manualOverrides[svc.service] !== undefined ? manualOverrides[svc.service] : svc.used,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
          Service Monitor
        </p>
        <div className="flex items-center gap-3">
          {data?.fetchedAt && (
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {new Date(data.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded disabled:opacity-50 transition-opacity"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)" }}
            />
          </div>
        ) : (
          <>
            {(data?.autoServices ?? []).map((svc, i) => (
              <div
                key={svc.service}
                style={{
                  borderBottom:
                    i < (data?.autoServices.length ?? 0) - 1 || (data?.manualServices.length ?? 0) > 0
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <AutoServiceRow svc={svc} />
              </div>
            ))}
            {manualWithOverrides.map((svc, i) => (
              <div
                key={svc.service}
                style={{
                  borderBottom: i < manualWithOverrides.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <ManualServiceRow svc={svc} onSave={saveManual} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
