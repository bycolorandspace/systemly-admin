"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import type { TuningExperiment } from "@/lib/queries/tuning";

const STATUS_COLORS: Record<string, string> = {
  open: "var(--muted-foreground)",
  confirmed: "var(--success)",
  rejected: "var(--destructive)",
  promoted: "var(--primary)",
  reverted: "var(--destructive)",
};

interface ExperimentRowProps {
  strategyId: string;
  experiment: TuningExperiment;
}

export function ExperimentRow({ strategyId, experiment }: ExperimentRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(experiment.status);
  const [busy, setBusy] = useState(false);

  const updateStatus = async (next: "confirmed" | "rejected") => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/strategies/${strategyId}/tuning/experiments/${experiment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        },
      );
      if (res.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td className="px-4 py-3" style={{ color: "var(--foreground)" }}>
        {experiment.hypothesis}
      </td>
      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
        {experiment.source.replace(/_/g, " ")}
      </td>
      <td className="px-4 py-3">
        <span
          className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded"
          style={{ background: "var(--muted)", color: STATUS_COLORS[status] }}
        >
          {status}
        </span>
      </td>
      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
        {formatDate(experiment.createdAt)}
      </td>
      <td className="px-4 py-3">
        {status === "open" && (
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus("confirmed")}
              disabled={busy}
              className="text-xs hover:underline disabled:opacity-50"
              style={{ color: "var(--success)" }}
            >
              Confirm
            </button>
            <button
              onClick={() => updateStatus("rejected")}
              disabled={busy}
              className="text-xs hover:underline disabled:opacity-50"
              style={{ color: "var(--destructive)" }}
            >
              Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
