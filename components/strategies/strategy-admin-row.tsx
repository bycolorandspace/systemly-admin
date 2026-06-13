"use client";

import { useState } from "react";

const ALL_TIERS = ["free", "starter", "plus", "pro"] as const;
type Tier = (typeof ALL_TIERS)[number];

const TIER_LABELS: Record<Tier, string> = {
  free: "Free",
  starter: "Starter",
  plus: "Plus",
  pro: "Pro",
};

interface StrategyAdminRowProps {
  id: string;
  name: string;
  description: string | null;
  required_tier: string;
  is_admin_enabled: boolean;
  available_tiers: string[] | null;
}

export function StrategyAdminRow({
  id,
  name,
  description,
  required_tier,
  is_admin_enabled: initialEnabled,
  available_tiers: initialTiers,
}: StrategyAdminRowProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [selectedTiers, setSelectedTiers] = useState<Tier[]>(
    (initialTiers ?? []) as Tier[],
  );
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/strategies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_admin_enabled: !enabled }),
      });
      if (res.ok) setEnabled(!enabled);
    } finally {
      setToggling(false);
    }
  };

  const toggleTier = (tier: Tier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier],
    );
    setSaved(false);
  };

  const saveTiers = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/strategies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, available_tiers: selectedTiers }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const tiersChanged =
    JSON.stringify(selectedTiers.slice().sort()) !==
    JSON.stringify((initialTiers ?? []).slice().sort());

  return (
    <div
      className="p-5 rounded-lg space-y-4"
      style={{ border: "1px solid var(--border)", background: "var(--card)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              {name}
            </p>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "var(--muted)",
                color: "var(--muted-foreground)",
              }}
            >
              {required_tier}
            </span>
          </div>
          {description && (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {description}
            </p>
          )}
          <p
            className="text-xs font-semibold mt-1.5"
            style={{ color: enabled ? "var(--success)" : "var(--destructive)" }}
          >
            {enabled ? "● ENABLED" : "● DISABLED"}
          </p>
        </div>

        {/* Enable/Disable toggle */}
        <button
          onClick={toggle}
          disabled={toggling}
          className="relative w-12 h-6 rounded-full flex-shrink-0 disabled:opacity-50"
          style={{
            background: enabled ? "var(--success)" : "var(--muted)",
            transition: "background 200ms",
          }}
          aria-label={`Toggle ${name}`}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full bg-white"
            style={{
              left: enabled ? "calc(100% - 20px)" : "4px",
              transition: "left 200ms",
            }}
          />
        </button>
      </div>

      {/* Tier availability */}
      <div>
        <p
          className="text-[10px] tracking-widest uppercase mb-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          Available to tiers{" "}
          <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>
            (none selected = all tiers)
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_TIERS.map((tier) => {
            const active = selectedTiers.includes(tier);
            return (
              <button
                key={tier}
                onClick={() => toggleTier(tier)}
                className="text-xs px-3 py-1 rounded-full border transition-colors"
                style={{
                  background: active ? "var(--primary)" : "transparent",
                  color: active
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
                  borderColor: active ? "var(--primary)" : "var(--border)",
                }}
              >
                {TIER_LABELS[tier]}
              </button>
            );
          })}
        </div>

        {tiersChanged && (
          <button
            onClick={saveTiers}
            disabled={saving}
            className="mt-3 text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save tier access"}
          </button>
        )}
      </div>
    </div>
  );
}
