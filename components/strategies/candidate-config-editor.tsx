"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CandidateConfigEditorProps {
  strategyId: string;
  candidateStrategyId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialConfig: Record<string, any>;
}

export function CandidateConfigEditor({
  strategyId,
  candidateStrategyId,
  initialConfig,
}: CandidateConfigEditorProps) {
  const router = useRouter();
  const [text, setText] = useState(() => JSON.stringify(initialConfig, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Invalid JSON — fix the syntax before saving");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      setError("Config must be a JSON object");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/strategies/${strategyId}/tuning/candidate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateStrategyId, config: parsed }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        rows={20}
        spellCheck={false}
        className="w-full font-mono text-xs p-3 rounded-md resize-y"
        style={{
          background: "var(--muted)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        }}
      />
      <div className="flex items-center justify-between">
        {error ? (
          <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        ) : (
          <span />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-md font-medium disabled:opacity-50"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Candidate Config"}
        </button>
      </div>
    </div>
  );
}
