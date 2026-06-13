"use client";

import { useState } from "react";

interface NumberConfigCardProps {
  label: string;
  description: string;
  configKey: string;
  initialValue: number;
  min?: number;
  max?: number;
  unit?: string;
}

export function NumberConfigCard({
  label,
  description,
  configKey,
  initialValue,
  min,
  max,
  unit,
}: NumberConfigCardProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/admin/set-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: configKey, value }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded text-sm text-right outline-none metric-number"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
          {unit && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{unit}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition-colors"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {saving ? "…" : saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
