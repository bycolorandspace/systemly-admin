"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { formatDate, formatGBP } from "@/lib/utils";

const TIER_PRICES: Record<string, number> = { starter: 25, plus: 55, pro: 199 };
const TIER_LIMITS: Record<string, Record<string, number>> = {
  free: { signals: 3, scans: 0, backtests: 0 },
  starter: { signals: 15, scans: 0, backtests: 0 },
  plus: { signals: 30, scans: 10, backtests: 0 },
  pro: { signals: 60, scans: 999, backtests: 10 },
};

const OUTCOME_ICONS: Record<string, string> = {
  TP1_HIT: "✅",
  TP2_HIT: "✅✅",
  TP3_HIT: "✅✅✅",
  SL_HIT: "❌",
  MANUAL_CLOSE: "⬜",
  SKIPPED: "⏭",
};

const TRIAL_EXTENSIONS = [
  { label: "+7 days", days: 7 },
  { label: "+14 days", days: 14 },
  { label: "+30 days", days: 30 },
];

interface UserDetailDrawerProps {
  userId: string;
  userName: string;
  onClose: () => void;
}

export function UserDetailDrawer({ userId, userName, onClose }: UserDetailDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [extendingTrial, setExtendingTrial] = useState(false);
  const [trialMsg, setTrialMsg] = useState<string | null>(null);
  const [overrideTier, setOverrideTier] = useState<string>("");
  const [tierSaving, setTierSaving] = useState(false);
  const [tierMsg, setTierMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setOverrideTier(d?.profile?.current_tier ?? "free"); setLoading(false); });
  }, [userId]);

  async function saveTier() {
    setTierSaving(true);
    setTierMsg(null);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: overrideTier }),
    });
    setTierMsg(res.ok ? `Tier updated to ${overrideTier}` : "Failed to update tier");
    setTierSaving(false);
  }

  const profile = data?.profile;
  const tier = overrideTier || profile?.current_tier || "free";
  const limits = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  const activeSub = (data?.subscriptions ?? []).find((s: any) => s.status === "active" || s.status === "trialing");
  const stripeSubId = activeSub?.stripe_subscription_id;
  const nextBillingDate = activeSub?.current_period_end;
  const trialEndsAt = profile?.trial_ends_at;

  const isSandbox = stripeSubId?.startsWith("sub_test_") || !stripeSubId?.startsWith("sub_");
  const stripeBaseUrl = `https://dashboard.stripe.com${isSandbox ? "/test" : ""}`;

  async function extendTrial(days: number) {
    setExtendingTrial(true);
    setTrialMsg(null);
    const current = trialEndsAt ? new Date(trialEndsAt) : new Date();
    current.setDate(current.getDate() + days);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trialEndsAt: current.toISOString() }),
    });
    if (res.ok) {
      setData((prev: any) => ({
        ...prev,
        profile: { ...prev.profile, trial_ends_at: current.toISOString() },
      }));
      setTrialMsg(`Trial extended to ${formatDate(current.toISOString())}`);
    } else {
      setTrialMsg("Failed to extend trial.");
    }
    setExtendingTrial(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="w-120 h-full overflow-auto flex flex-col"
        style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>{userName}</h2>
            {profile && (
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{profile.email}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)" }}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-auto divide-y" style={{ borderColor: "var(--border)" }}>
            {/* Profile */}
            <div className="px-6 py-4">
              <p
                className="text-[10px] tracking-widest uppercase mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Profile
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Tier override</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={overrideTier}
                      onChange={(e) => setOverrideTier(e.target.value)}
                      className="text-sm rounded px-2 py-1 outline-none"
                      style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                      {["free", "starter", "plus", "pro"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={saveTier}
                      disabled={tierSaving}
                      className="text-xs px-2 py-1 rounded disabled:opacity-50"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                    >
                      {tierSaving ? "…" : "Set"}
                    </button>
                  </div>
                  {tierMsg && <p className="text-[11px] mt-1" style={{ color: "var(--muted-foreground)" }}>{tierMsg}</p>}
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Joined</p>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {profile?.created_at ? formatDate(profile.created_at) : "—"}
                  </p>
                </div>
                {nextBillingDate && (
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Next Billing</p>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {formatDate(nextBillingDate)}
                    </p>
                  </div>
                )}
                {stripeSubId && (
                  <div>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Stripe</p>
                    <a
                      href={`${stripeBaseUrl}/subscriptions/${stripeSubId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs"
                      style={{ color: "var(--primary)" }}
                    >
                      View subscription
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Trial management */}
            <div className="px-6 py-4">
              <p
                className="text-[10px] tracking-widest uppercase mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Trial
              </p>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Trial ends</p>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {trialEndsAt ? formatDate(trialEndsAt) : "No active trial"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {TRIAL_EXTENSIONS.map(({ label, days }) => (
                  <button
                    key={days}
                    onClick={() => extendTrial(days)}
                    disabled={extendingTrial}
                    className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 transition-opacity"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {trialMsg && (
                <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                  {trialMsg}
                </p>
              )}
            </div>

            {/* Usage bars */}
            <div className="px-6 py-4">
              <p
                className="text-[10px] tracking-widest uppercase mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Usage (this month)
              </p>
              {["signals", "scans", "backtests"].map((type) => {
                const used = (data?.usage ?? [])
                  .filter((u: any) => u.usage_type === type)
                  .reduce((s: number, u: any) => s + Number(u.count), 0);
                const limit = limits[type] ?? 0;
                const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
                return (
                  <div key={type} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize" style={{ color: "var(--muted-foreground)" }}>{type}</span>
                      <span className="metric-number" style={{ color: "var(--foreground)" }}>
                        {used} / {limit === 999 ? "∞" : limit}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? "var(--destructive)" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Recent signals */}
            <div className="px-6 py-4">
              <p
                className="text-[10px] tracking-widest uppercase mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Recent Signals
              </p>
              <div className="space-y-2">
                {(data?.signals ?? []).slice(0, 10).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {formatDate(s.created_at)}
                      </span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>
                        {s.symbol}
                      </span>
                      <span style={{ color: s.direction === "BUY" ? "var(--success)" : "var(--destructive)" }}>
                        {s.direction}
                      </span>
                    </div>
                    <span>
                      {s.manual_outcome ? OUTCOME_ICONS[s.manual_outcome] ?? s.manual_outcome : "—"}
                    </span>
                  </div>
                ))}
                {(data?.signals?.length ?? 0) === 0 && (
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No signals yet</p>
                )}
              </div>
            </div>

            {/* Subscription history */}
            <div className="px-6 py-4">
              <p
                className="text-[10px] tracking-widest uppercase mb-3"
                style={{ color: "var(--muted-foreground)" }}
              >
                Subscription History
              </p>
              <div className="space-y-2">
                {(data?.subscriptions ?? []).map((s: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="capitalize font-medium" style={{ color: "var(--foreground)" }}>
                      {s.tier}
                    </span>
                    <span style={{ color: s.status === "active" ? "var(--success)" : "var(--muted-foreground)" }}>
                      {s.status}
                    </span>
                    <span style={{ color: "var(--muted-foreground)" }}>
                      {s.current_period_start ? formatDate(s.current_period_start) : "—"}
                    </span>
                    {s.current_period_end && (
                      <span style={{ color: "var(--muted-foreground)" }}>
                        → {formatDate(s.current_period_end)}
                      </span>
                    )}
                  </div>
                ))}
                {(data?.subscriptions?.length ?? 0) === 0 && (
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No subscription history</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
