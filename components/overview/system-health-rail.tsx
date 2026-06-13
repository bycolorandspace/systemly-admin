"use client";

import { useState } from "react";
import { Wifi, Bell, AlertCircle } from "lucide-react";

interface SystemHealthData {
  mt5ActiveConnections: number;
  activePriceAlerts: number;
  signalSharingPaused: boolean;
  testTradingPaused: boolean;
}

function StatBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-md"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
      <div>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </p>
        <p className="text-sm font-semibold metric-number" style={{ color: "var(--foreground)" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ToggleBadge({
  label,
  paused,
  configKey,
}: {
  label: string;
  paused: boolean;
  configKey: string;
}) {
  const [isPaused, setIsPaused] = useState(paused);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/toggle-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: configKey, paused: !isPaused }),
      });
      setIsPaused(!isPaused);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-md"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: isPaused ? "var(--destructive)" : "var(--success)" }}
        >
          {isPaused ? "PAUSED" : "LIVE"}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={loading}
        className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
        style={{
          background: isPaused ? "var(--muted)" : "var(--success)",
        }}
        aria-label={`Toggle ${label}`}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
          style={{
            background: "white",
            left: isPaused ? "2px" : "calc(100% - 18px)",
          }}
        />
      </button>
    </div>
  );
}

export function SystemHealthRail({ data }: { data: SystemHealthData }) {
  return (
    <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
      <p className="text-[10px] tracking-widest uppercase mb-3"
        style={{ color: "var(--muted-foreground)" }}>
        System Health
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBadge
          icon={Wifi}
          label="MT5 Connections"
          value={data.mt5ActiveConnections}
        />
        <StatBadge
          icon={Bell}
          label="Active Alerts"
          value={data.activePriceAlerts}
        />
        <ToggleBadge
          label="Signal Sharing"
          paused={data.signalSharingPaused}
          configKey="signal_sharing"
        />
        <ToggleBadge
          label="Test Trading"
          paused={data.testTradingPaused}
          configKey="test_trading"
        />
      </div>
    </div>
  );
}
