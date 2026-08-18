"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PromoteButtonProps {
  strategyId: string;
  strategyName: string;
  experimentId: string;
}

export function PromoteButton({
  strategyId,
  strategyName,
  experimentId,
}: PromoteButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromote = async () => {
    const confirmed = window.confirm(
      `Apply this candidate's config to the live "${strategyName}" strategy? ` +
        `The current live config will be snapshotted for rollback before it's overwritten.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/strategies/${strategyId}/tuning/promote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ experimentId }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Promotion failed");
        return;
      }
      if (data.warning) setError(data.warning);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Promotion failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handlePromote}
        disabled={busy}
        className="text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
        style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
      >
        {busy ? "Promoting…" : "Promote to Live"}
      </button>
      {error && (
        <p className="text-[11px] max-w-xs text-right" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
