"use client";

import { useState } from "react";
import {
  BEHAVIOUR_PROFILE_SWITCHES,
  readBehaviourProfile,
  type BehaviourProfile,
} from "@/lib/behaviour-profile";

interface BehaviourProfileControlProps {
  id: string;
  name: string;
  /** `config.behaviour_profile` as stored, or null when the strategy has none. */
  initialProfile: BehaviourProfile | null;
}

/**
 * The July rails switch for one system strategy: what is stored, read-only, plus an on/off
 * toggle that sets or removes `config.behaviour_profile`. The rollback path that needs no SQL.
 * Only the switch changes; every other setting on the strategy stays as it is.
 */
export function BehaviourProfileControl({
  id,
  name,
  initialProfile,
}: BehaviourProfileControlProps) {
  const [profile, setProfile] = useState<BehaviourProfile | null>(initialProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = profile !== null;

  const toggle = async () => {
    const next = !on;
    const confirmed = window.confirm(
      next
        ? `Turn on the July rails for "${name}"? Every scan on this strategy changes straight away, for every user, and for the community feed if it runs on this strategy. Its other settings stay as they are.`
        : `Turn off the July rails for "${name}"? Scans go back to today's behaviour straight away, for every user. Its other settings stay as they are, so undo any related setting changes separately.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/strategies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, behaviour_profile_enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't change the switch");
        return;
      }
      setProfile(readBehaviourProfile(data.behaviour_profile));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change the switch");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p
        className="text-[10px] tracking-widest uppercase mb-2"
        style={{ color: "var(--muted-foreground)" }}
      >
        July rails{" "}
        <span style={{ fontWeight: 400 }}>(config.behaviour_profile)</span>
      </p>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <p
            className="text-xs font-semibold"
            style={{ color: on ? "var(--success)" : "var(--muted-foreground)" }}
          >
            {on ? "● ON" : "● OFF"}
          </p>
          {on ? (
            <ul className="space-y-1">
              {BEHAVIOUR_PROFILE_SWITCHES.map((s) => (
                <li
                  key={s.key}
                  className="text-xs"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {s.label}{" "}
                  <span className="font-mono text-[10px]">
                    {s.key}: {profile[s.key]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Scans on this strategy run today&apos;s behaviour.
            </p>
          )}
          {error && (
            <p className="text-[11px]" style={{ color: "var(--destructive)" }}>
              {error}
            </p>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={toggle}
          disabled={busy}
          className="relative w-12 h-6 rounded-full flex-shrink-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--card)]"
          style={{
            background: on ? "var(--success)" : "var(--muted)",
            transition: "background 200ms",
          }}
          aria-label={`July rails for ${name}`}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full bg-white"
            style={{
              left: on ? "calc(100% - 20px)" : "4px",
              transition: "left 200ms",
            }}
          />
        </button>
      </div>
    </div>
  );
}
