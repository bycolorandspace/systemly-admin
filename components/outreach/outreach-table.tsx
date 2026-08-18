"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Row {
  id: string;
  email: string;
  firstName: string;
  tier: string;
  createdAt: string;
  scanCount: number;
  isPaying: boolean;
  segment: "never_scanned" | "all_no_trade";
  outreachSentAt: string | null;
  trialEndsAt: string | null;
  trialTier: string | null;
}

const SEGMENTS = [
  { key: "never_scanned", label: "Never scanned", blurb: "Signed up and never generated a signal." },
  { key: "all_no_trade", label: "All scans were NO_TRADE", blurb: "Every scan returned no trade, before the 17 Aug fix." },
] as const;

export function OutreachTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<Row["segment"]>("never_scanned");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");

  async function load() {
    const res = await fetch("/api/admin/outreach");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function send(row: Row) {
    setBusy(row.id);
    setMsg(null);
    const res = await fetch("/api/admin/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: row.id, segment: row.segment }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Sent to ${row.email}.` : (data.error ?? "Send failed."));
    if (res.ok) await load();
    setBusy(null);
  }

  async function sendTest() {
    if (!testEmail) return;
    setBusy("test");
    setMsg(null);
    const res = await fetch("/api/admin/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segment, testTo: testEmail }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? `Test sent to ${testEmail}.` : (data.error ?? "Test send failed."));
    setBusy(null);
  }

  const visible = rows.filter((r) => r.segment === segment);
  const pending = visible.filter((r) => !r.outreachSentAt).length;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {SEGMENTS.map((s) => {
          const n = rows.filter((r) => r.segment === s.key).length;
          const active = segment === s.key;
          return (
            <button key={s.key} onClick={() => setSegment(s.key)}
              className="px-3 py-2 rounded text-xs text-left"
              style={{
                background: active ? "var(--primary)" : "var(--card)",
                color: active ? "#000" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              <span className="font-medium">{s.label}</span>
              <span className="ml-2 metric-number">{n}</span>
            </button>
          );
        })}
      </div>

      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        {SEGMENTS.find((s) => s.key === segment)?.blurb} {pending} still to contact.
      </p>

      <div className="rounded-lg p-4 flex flex-wrap items-end gap-2"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            Send yourself a test first
          </label>
          <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
            placeholder="chike@systemly.ai" className="px-2 py-1.5 rounded text-xs w-56"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
        </div>
        <button onClick={sendTest} disabled={busy === "test" || !testEmail}
          className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
          style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
          {busy === "test" ? "Sending..." : "Send test"}
        </button>
        {msg && <p className="text-xs w-full" style={{ color: "var(--muted-foreground)" }}>{msg}</p>}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["User", "Tier", "Joined", "Scans", "Trial", "Outreach", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-[10px] tracking-widest uppercase font-medium"
                  style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>Loading...</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>Nobody in this segment.</td></tr>
            ) : visible.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>{r.firstName}</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: r.isPaying ? "var(--primary)" : "var(--secondary)",
                      color: r.isPaying ? "#000" : "var(--muted-foreground)",
                    }}>{r.tier}</span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 metric-number" style={{ color: "var(--foreground)" }}>{r.scanCount}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {r.trialEndsAt ? `${r.trialTier ?? "pro"} to ${formatDate(r.trialEndsAt)}` : "—"}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: r.outreachSentAt ? "var(--success)" : "var(--muted-foreground)" }}>
                  {r.outreachSentAt ? `Sent ${formatDate(r.outreachSentAt)}` : "Not contacted"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => send(r)} disabled={busy === r.id || !!r.outreachSentAt}
                    className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-40"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    {busy === r.id ? "Sending..." : r.outreachSentAt ? "Sent" : "Send"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
