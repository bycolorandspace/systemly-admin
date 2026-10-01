import { formatDate } from "@/lib/utils";

/**
 * Staff-only labels for where a user's plan came from.
 *
 * The columns are written by the main app's Stripe handlers
 * (systemlyai `helpers/tier-source.ts`), by this app's users PATCH route for
 * an admin grant, and filled in as "unrecorded" by the database when a writer
 * changes the tier without saying where it came from
 * (systemlyai `supabase/migrations/20260929192907_tier_source.sql`).
 *
 * NULL means nothing has been recorded since 29 September 2026, when the
 * columns were added: for a free account that is the default, for a paid one
 * it means the tier was set before anyone recorded how, which is the question
 * this was built to stop being unanswerable.
 */

export type TierSource = "stripe" | "admin" | "unrecorded";

export interface TierSourceFields {
  current_tier?: string | null;
  tier_source?: TierSource | null;
  tier_source_at?: string | null;
  tier_granted_by?: string | null;
  tier_source_note?: string | null;
  stripe_customer_id?: string | null;
}

/** Admin user ids to emails, for naming who granted what. */
export type Grantors = Record<string, string>;

function grantorName(id: string | null | undefined, grantors: Grantors): string {
  if (!id) return "an unrecorded admin";
  return grantors[id] ?? id;
}

/** One line for the drawer: what set this plan, who, and when. */
export function tierSourceLabel(p: TierSourceFields, grantors: Grantors): string {
  const tier = p.current_tier ?? "free";
  const paid = tier !== "free";
  const when = p.tier_source_at ? ` on ${formatDate(p.tier_source_at)}` : "";

  switch (p.tier_source) {
    case "stripe":
      return paid ? `Paid (Stripe)${when}` : `Moved to free by Stripe${when}`;
    case "admin":
      return paid
        ? `Admin grant by ${grantorName(p.tier_granted_by, grantors)}${when}`
        : `Set to free by ${grantorName(p.tier_granted_by, grantors)}${when}`;
    case "unrecorded":
      return `Unrecorded: changed${when} by a path that did not say where the plan came from`;
    default:
      if (!paid) return "Free (default)";
      return p.stripe_customer_id
        ? "Not recorded (set before 29 Sep 2026). Stripe customer on file"
        : "Not recorded (set before 29 Sep 2026). No Stripe customer";
  }
}

/** Short tag for the user list, or null where there is nothing worth saying. */
export function tierSourceTag(p: TierSourceFields): string | null {
  switch (p.tier_source) {
    case "stripe":
      return "Stripe";
    case "admin":
      return "Admin grant";
    case "unrecorded":
      return "Unrecorded";
    default:
      return (p.current_tier ?? "free") === "free" ? null : "No record";
  }
}

/** One `tier.changed` / `trial.changed` row from security_events. */
export interface TierHistoryEvent {
  event_type: "tier.changed" | "trial.changed";
  created_at: string;
  metadata: Record<string, unknown> | null;
}

/** One line of history, newest first in the drawer. */
export function tierHistoryLine(e: TierHistoryEvent, grantors: Grantors): string {
  const m = e.metadata ?? {};
  const by = (source: unknown, grantedBy: unknown) => {
    if (source === "stripe") return "Stripe";
    if (source === "admin") return grantorName(grantedBy as string | null, grantors);
    if (typeof source === "string" && source.startsWith("link:")) return `trial ${source}`;
    if (source === "unrecorded") return "unrecorded";
    return "no source";
  };
  if (e.event_type === "trial.changed") {
    const to = (m.to_tier as string | null) ?? "none";
    const ends = m.ends_at ? ` to ${formatDate(m.ends_at as string)}` : "";
    return `Trial ${to}${ends} · ${by(m.source, m.granted_by)}`;
  }
  const from = (m.from as string | null) ?? "new";
  const to = (m.to as string | null) ?? "?";
  const move = from === to ? to : `${from} → ${to}`;
  const note = m.note ? ` · ${m.note as string}` : "";
  return `${move} · ${by(m.source, m.granted_by)}${note}`;
}
