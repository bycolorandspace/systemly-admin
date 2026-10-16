"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

export interface AdminSignalGrant {
  id: string;
  amount: number;
  granted_at: string;
  emailed: boolean;
}

interface SignalGrantPanelProps {
  userId: string;
  grants: AdminSignalGrant[];
  /** The plan has no ceiling, so extra signals could never be spent. */
  unlimited: boolean;
  /** Re-read the user record after a change. */
  onChanged: () => Promise<void>;
}

const PRESETS = [5, 10, 20];

const fieldStyle = {
  background: "var(--secondary)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
};

/**
 * Add extra signals to a user's account, then email them about it.
 *
 * Two presses on purpose: the grant is made first and listed, and the email is
 * sent from the list, so a gift can be made quietly and a send can be retried
 * on its own if it fails. Signals last until the end of the month they are
 * added in (the window the main app's getSignalBonus counts).
 */
export function SignalGrantPanel({ userId, grants, unlimited, onChanged }: SignalGrantPanelProps) {
  const [choice, setChoice] = useState<string>("10");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const amount = choice === "custom" ? Number(custom) : Number(choice);
  const amountValid = Number.isInteger(amount) && amount >= 1 && amount <= 500;

  async function addSignals() {
    setBusy("add");
    setMsg(null);
    const res = await fetch(`/api/admin/users/${userId}/signal-grants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(`${amount} signals added for this month.`);
      await onChanged();
    } else {
      setMsg(body.error ?? "Could not add the signals.");
    }
    setBusy(null);
  }

  async function sendEmail(grantId: string) {
    setBusy(grantId);
    setMsg(null);
    const res = await fetch(`/api/admin/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "signals-added", userId, params: { grantId } }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg(
        body.symbol
          ? `Email sent to ${body.to}, naming ${body.symbol}.`
          : `Email sent to ${body.to}. No signals yet, so no symbol named.`,
      );
      await onChanged();
    } else {
      setMsg(body.error ?? "Could not send the email.");
    }
    setBusy(null);
  }

  return (
    <div>
      <p className="text-[10px] tracking-widest uppercase mb-3" style={{ color: "var(--muted-foreground)" }}>
        Bonus signals
      </p>

      {unlimited ? (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          This plan has unlimited signals, so extra ones cannot be added.
        </p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="px-2 py-1.5 rounded text-xs"
            style={fieldStyle}
            aria-label="Signals to add"
          >
            {PRESETS.map((n) => (
              <option key={n} value={String(n)}>
                {n} signals
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
          {choice === "custom" && (
            <input
              type="number"
              min={1}
              max={500}
              step={1}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Amount"
              className="w-20 px-2 py-1.5 rounded text-xs outline-none"
              style={fieldStyle}
              aria-label="Custom amount"
            />
          )}
          <button
            onClick={addSignals}
            disabled={!amountValid || busy !== null}
            className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {busy === "add" ? "Adding…" : "Add signals"}
          </button>
        </div>
      )}

      {grants.length > 0 && (
        <div className="mt-3 space-y-2">
          {grants.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--foreground)" }}>
                +{g.amount} <span style={{ color: "var(--muted-foreground)" }}>on {formatDate(g.granted_at)}</span>
              </span>
              {g.emailed ? (
                <span style={{ color: "var(--success)" }}>Emailed</span>
              ) : (
                <button
                  onClick={() => sendEmail(g.id)}
                  disabled={busy !== null}
                  className="px-2 py-1 rounded text-xs font-medium disabled:opacity-50"
                  style={fieldStyle}
                >
                  {busy === g.id ? "Sending…" : "Send email"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
        Added signals last until the end of this month.
      </p>
      {msg && (
        <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
