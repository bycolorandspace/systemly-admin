"use client";

import { useState } from "react";
import { formatGBPDecimal, getMonthStart } from "@/lib/utils";
import { Plus, Check } from "lucide-react";

interface CostEntry {
  id: string;
  service_name: string;
  amount_gbp: number;
  period_month: string;
}

interface CostTrackerProps {
  initialCosts: CostEntry[];
  currentMonth: string;
}

export function CostTracker({ initialCosts, currentMonth }: CostTrackerProps) {
  const [costs, setCosts] = useState(initialCosts);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newService, setNewService] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (serviceName: string) => {
    const amount = parseFloat(editValue) || 0;
    setSaving(true);
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
    setEditing(null);
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newService.trim()) return;
    setSaving(true);
    const amount = parseFloat(newAmount) || 0;
    await fetch("/api/admin/cost-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ service_name: newService.trim(), amount_gbp: amount }),
    });
    setCosts((prev) => [
      ...prev,
      { id: Date.now().toString(), service_name: newService.trim(), amount_gbp: amount, period_month: currentMonth },
    ]);
    setNewService("");
    setNewAmount("");
    setShowAdd(false);
    setSaving(false);
  };

  const total = costs.reduce((s, c) => s + Number(c.amount_gbp), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Cost Tracker
          </h3>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {currentMonth} — click any amount to edit
          </p>
        </div>
        <span className="text-sm font-bold metric-number" style={{ color: "var(--primary)" }}>
          Total: {formatGBPDecimal(total)}/mo
        </span>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--secondary)" }}>
              <th className="text-left px-4 py-2.5 text-[10px] font-medium tracking-widest uppercase"
                style={{ color: "var(--muted-foreground)" }}>Service</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-medium tracking-widest uppercase"
                style={{ color: "var(--muted-foreground)" }}>Monthly Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
            {costs.map((cost) => (
              <tr key={cost.service_name} className="group hover:bg-accent transition-colors">
                <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
                  {cost.service_name}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing === cost.service_name ? (
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>£</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave(cost.service_name);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        autoFocus
                        className="w-20 text-right text-sm rounded px-1.5 py-0.5 outline-none metric-number"
                        style={{
                          background: "var(--secondary)",
                          border: "1px solid var(--primary)",
                          color: "var(--foreground)",
                        }}
                      />
                      <button onClick={() => handleSave(cost.service_name)}
                        className="p-0.5 rounded" style={{ color: "var(--success)" }}>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(cost.service_name); setEditValue(String(Number(cost.amount_gbp))); }}
                      className="font-medium metric-number rounded px-1 hover:bg-accent transition-colors"
                      style={{ color: Number(cost.amount_gbp) > 0 ? "var(--foreground)" : "var(--muted-foreground)" }}
                    >
                      {formatGBPDecimal(Number(cost.amount_gbp))}/mo
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showAdd ? (
          <div className="flex items-center gap-2 px-4 py-3 border-t"
            style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Service name"
              autoFocus
              className="flex-1 text-sm px-2 py-1 rounded outline-none"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>£</span>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0"
              className="w-20 text-sm px-2 py-1 rounded outline-none text-right metric-number"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button onClick={handleAdd} disabled={saving}
              className="text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              Add
            </button>
            <button onClick={() => setShowAdd(false)}
              className="text-xs" style={{ color: "var(--muted-foreground)" }}>Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full text-xs py-2.5 flex items-center justify-center gap-1.5 transition-colors hover:bg-accent border-t"
            style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add service
          </button>
        )}
      </div>
    </div>
  );
}
