"use client";

import { useState } from "react";

interface ToggleCardProps {
  label: string;
  description: string;
  paused: boolean;
  configKey: string;
}

export function ToggleCard({ label, description, paused: initialPaused, configKey }: ToggleCardProps) {
  const [isPaused, setIsPaused] = useState(initialPaused);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/toggle-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: configKey, paused: !isPaused }),
      });
      if (res.ok) setIsPaused(!isPaused);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between p-5 rounded-lg"
      style={{ border: "1px solid var(--border)", background: "var(--card)" }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {description}
        </p>
        <p
          className="text-xs font-semibold mt-2"
          style={{ color: isPaused ? "var(--destructive)" : "var(--success)" }}
        >
          {isPaused ? "● PAUSED" : "● LIVE"}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ml-6"
        style={{
          background: isPaused ? "var(--muted)" : "var(--success)",
          transition: "background 200ms",
        }}
        aria-label={`Toggle ${label}`}
      >
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{
            left: isPaused ? "4px" : "calc(100% - 20px)",
            transition: "left 200ms",
          }}
        />
      </button>
    </div>
  );
}
