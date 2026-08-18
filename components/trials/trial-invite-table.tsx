"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";

interface Invite {
  code: string;
  tier: string;
  days: number;
  label: string | null;
  active: boolean;
  max_redemptions: number | null;
  expires_at: string | null;
  created_at: string;
  redemptions: number;
}

const APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "https://app.systemly.ai";

export function TrialInviteTable() {
  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [tier, setTier] = useState("plus");
  const [days, setDays] = useState("30");
  const [label, setLabel] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/trials");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/admin/trials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        tier,
        days: Number(days),
        label: label || null,
        max_redemptions: maxRedemptions || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCode("");
      setLabel("");
      setMaxRedemptions("");
      setMsg("Link created.");
      await load();
    } else {
      setMsg(data.error ?? "Could not create the link.");
    }
    setSaving(false);
  }

  async function toggle(inv: Invite) {
    await fetch(`/api/admin/trials/${inv.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !inv.active }),
    });
    load();
  }

  function copy(inviteCode: string) {
    navigator.clipboard.writeText(`${APP_URL}/join/${inviteCode}`);
    setCopied(inviteCode);
    setTimeout(() => setCopied(null), 2000);
  }

  const inputStyle = {
    background: "var(--secondary)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-6">
      <div
        className="rounded-lg p-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
          New link
        </p>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="plus30"
              className="px-2 py-1.5 rounded text-xs w-32" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value)}
              className="px-2 py-1.5 rounded text-xs" style={inputStyle}>
              <option value="starter">Starter</option>
              <option value="plus">Plus</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Days</label>
            <input value={days} onChange={(e) => setDays(e.target.value)} type="number" min={1} max={365}
              className="px-2 py-1.5 rounded text-xs w-20" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Label</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Founder outreach"
              className="px-2 py-1.5 rounded text-xs w-44" style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Max uses</label>
            <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="unlimited"
              className="px-2 py-1.5 rounded text-xs w-24" style={inputStyle} />
          </div>
          <button onClick={create} disabled={saving || !code}
            className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--primary)", color: "#000" }}>
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
        {msg && <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>{msg}</p>}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Link", "Grants", "Used", "Expires", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2 text-[10px] tracking-widest uppercase font-medium"
                  style={{ color: "var(--muted-foreground)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>No trial links yet.</td></tr>
            ) : rows.map((inv) => (
              <tr key={inv.code} style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>/join/{inv.code}</p>
                  {inv.label && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{inv.label}</p>}
                </td>
                <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                  {inv.days} days of {inv.tier}
                </td>
                <td className="px-4 py-3 metric-number" style={{ color: "var(--foreground)" }}>
                  {inv.redemptions}{inv.max_redemptions ? ` / ${inv.max_redemptions}` : ""}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {inv.expires_at ? formatDate(inv.expires_at) : "No end date"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded"
                    style={{
                      background: inv.active ? "var(--success)" : "var(--secondary)",
                      color: inv.active ? "#000" : "var(--muted-foreground)",
                    }}>
                    {inv.active ? "Active" : "Off"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => copy(inv.code)} className="text-xs mr-3" style={{ color: "var(--primary)" }}>
                    {copied === inv.code ? "Copied" : "Copy link"}
                  </button>
                  <button onClick={() => toggle(inv)} className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {inv.active ? "Deactivate" : "Activate"}
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
