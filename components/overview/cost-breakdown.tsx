"use client";

import { useState } from "react";
import { formatGBPDecimal } from "@/lib/utils";
import { Plus } from "lucide-react";

interface CostEntry {
  service_name: string;
  amount_gbp: number;
}

interface CostBreakdownProps {
  costs: CostEntry[];
}

export function CostBreakdown({ costs: initialCosts }: CostBreakdownProps) {
  const [costs, setCosts] = useState(initialCosts);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const totalCosts = costs.reduce((s, c) => s + Number(c.amount_gbp), 0);

  const handleEdit = (serviceName: string, currentAmount: number) => {
    setEditing(serviceName);
    setEditValue(String(currentAmount));
  };

  const handleSave = async (serviceName: string) => {
    setSaving(true);
    const amount = parseFloat(editValue) || 0;

    try {
      await fetch("/api/admin/cost-entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_name: serviceName, amount_gbp: amount }),
      });

      setCosts((prev) =>
        prev.map((c) =>
          c.service_name === serviceName ? { ...c, amount_gbp: amount } : c
        )
      );
    } finally {
      setEditing(null);
      setSaving(false);
    }
  };

  return (
    <div className="w-[340px] flex-shrink-0">
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>≡</span>
          <span
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: "var(--foreground)" }}
          >
            Cost Breakdown
          </span>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {costs.map((cost) => (
          <div
            key={cost.service_name}
            className="flex items-center justify-between px-6 py-3.5 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: "var(--muted-foreground)" }}
              />
              <span className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                {cost.service_name}
              </span>
            </div>

            {editing === cost.service_name ? (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>£</span>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSave(cost.service_name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(cost.service_name);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  autoFocus
                  className="w-16 text-right text-sm rounded px-1 outline-none"
                  style={{
                    background: "var(--secondary)",
                    border: "1px solid var(--primary)",
                    color: "var(--foreground)",
                  }}
                />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/mo</span>
              </div>
            ) : (
              <button
                onClick={() => handleEdit(cost.service_name, Number(cost.amount_gbp))}
                className="text-sm font-medium metric-number ml-2 rounded px-1 transition-colors hover:bg-accent"
                style={{
                  color:
                    Number(cost.amount_gbp) > 0
                      ? "var(--foreground)"
                      : "var(--muted-foreground)",
                }}
                title="Click to edit"
              >
                {formatGBPDecimal(Number(cost.amount_gbp))}/mo
              </button>
            )}
          </div>
        ))}
      </div>

      <div
        className="px-6 py-4 border-t flex items-center justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Total Costs
        </span>
        <span
          className="text-sm font-bold metric-number"
          style={{ color: "var(--primary)" }}
        >
          {formatGBPDecimal(totalCosts)}/mo
        </span>
      </div>

      <div className="px-6 pb-5">
        <button
          className="w-full text-xs py-2 rounded-md border transition-colors hover:bg-accent flex items-center justify-center gap-1.5"
          style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Cost
        </button>
      </div>
    </div>
  );
}
