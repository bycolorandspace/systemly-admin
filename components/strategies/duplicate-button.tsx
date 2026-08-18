"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DuplicateButtonProps {
  strategyId: string;
}

export function DuplicateButton({ strategyId }: DuplicateButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDuplicate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/strategies/${strategyId}/tuning/duplicate`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Duplicate failed");
        return;
      }
      if (data.warning) setError(data.warning);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDuplicate}
        disabled={busy}
        className="text-xs px-3 py-1.5 rounded-md font-medium border disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        {busy ? "Duplicating…" : "Duplicate → New Candidate"}
      </button>
      {error && (
        <p className="text-[11px] max-w-xs text-right" style={{ color: "var(--destructive)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
