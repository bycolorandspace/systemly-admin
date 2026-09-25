import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Is each email actually going out?
 *
 * Until 24 September 2026 nothing could answer that. Over the preceding month
 * the product sent 437 messages, and eleven of its emails sent none of them:
 * the founder check-in, both day-3 nudges, the day-7, day-14 and day-30
 * lifecycle mails, the weekly wins, the daily digest, the trial reminder and
 * two of the four milestone mails. Three separate causes, all invisible,
 * because a lifecycle email that is broken and a lifecycle email that had
 * nobody to write to look exactly alike: neither leaves a trace.
 *
 * So this page is built on two tables and a list of expectations:
 *
 * - `email_broadcast_log` — one row per delivered message, written by
 *   `deliver()` in the main app. Answers "when did this last send".
 * - `email_send_failures` — one row per send that threw, and per event that
 *   failed to start one. Answers "and if not, why not".
 * - `EMAIL_REGISTRY` below — every email the product can send. Without it a
 *   broken email is an absent row, and an absent row is invisible. With it,
 *   the email is always on screen and the count beside it is zero.
 *
 * Read straight from core's Supabase with the service role, like every other
 * panel here. No new endpoint in the main app, no third-party call.
 */

/** How long a stretch of silence is normal before it means something. */
type Expectation =
  /** Should send on most days; flag if it has not. */
  | { kind: "regular"; maxSilentDays: number }
  /**
   * Only sends when a user does something, or when the market does. Silence
   * is a fact about the month, not a fault, so it is shown and never flagged.
   */
  | { kind: "conditional" }
  /** Sent by hand from the broadcast endpoint. */
  | { kind: "manual" };

export interface EmailDefinition {
  /** Campaign family, i.e. the campaign key with any date or number stripped. */
  family: string;
  label: string;
  /** What has to happen for this to send, in one line. */
  trigger: string;
  expectation: Expectation;
}

export const EMAIL_REGISTRY: EmailDefinition[] = [
  {
    family: "sendWelcomeEmail",
    label: "Welcome",
    trigger: "They finish the onboarding questions",
    expectation: { kind: "regular", maxSilentDays: 2 },
  },
  {
    family: "sendFounderCheckin",
    label: "Founder check-in",
    trigger: "Two hours after onboarding",
    expectation: { kind: "regular", maxSilentDays: 2 },
  },
  {
    family: "sendActivationNudge",
    label: "Activation nudge",
    trigger: "24 hours in, if they have run no signals",
    expectation: { kind: "regular", maxSilentDays: 3 },
  },
  {
    family: "signal-closed",
    label: "Your signal closed",
    trigger: "One of their own signals reaches a target or its stop",
    expectation: { kind: "regular", maxSilentDays: 3 },
  },
  {
    family: "academy-start",
    label: "Academy start, day 5",
    trigger: "Day 5, if they gave an onboarding answer and have barely started",
    expectation: { kind: "regular", maxSilentDays: 7 },
  },
  {
    family: "allowance-reset",
    label: "Allowance resets",
    trigger: "26th of the month, if they have signals left and spent at least one",
    expectation: { kind: "conditional" },
  },
  {
    family: "abandoned-scan",
    label: "Unfinished scan",
    trigger: "They started a scan and never got a result",
    expectation: { kind: "conditional" },
  },
  {
    family: "scan-failed",
    label: "Scan failed on our side",
    trigger: "A scan errored and they have not completed one since",
    expectation: { kind: "conditional" },
  },
  {
    family: "community-momentum-d2",
    label: "Community wins, day 2",
    trigger: "Day 2, if anything closed community-wide",
    expectation: { kind: "regular", maxSilentDays: 3 },
  },
  {
    family: "community-momentum-d7",
    label: "Community momentum, day 7",
    trigger: "Day 7, if anything closed community-wide",
    expectation: { kind: "regular", maxSilentDays: 3 },
  },
  {
    family: "sendMonthlyRecap",
    label: "Monthly recap, day 30",
    trigger: "Day 30, if there are any stats to show",
    expectation: { kind: "regular", maxSilentDays: 14 },
  },
  {
    family: "sendWinbackUpdates",
    label: "Winback, day 60",
    trigger: "Day 60, if they have been inactive 30 days",
    expectation: { kind: "conditional" },
  },
  {
    family: "weekly-wins",
    label: "Weekly wins",
    trigger: "Mondays, unless the week lost money",
    expectation: { kind: "conditional" },
  },
  {
    family: "sendTrialEnding",
    label: "Trial ending",
    trigger: "24 hours before a trial converts to a charge",
    expectation: { kind: "conditional" },
  },
  {
    family: "quota-hit",
    label: "Quota hit upsell",
    trigger: "They use the last signal of their monthly allowance",
    expectation: { kind: "conditional" },
  },
  {
    family: "sendProductUpdate",
    label: "Product update",
    trigger: "Sent by hand from the broadcast endpoint",
    expectation: { kind: "manual" },
  },
  {
    family: "sendStarterPrice",
    label: "Starter is now £9.99",
    trigger: "Sent by hand, once, to free accounts that saw the old price",
    expectation: { kind: "manual" },
  },
  {
    family: "sendFounderInvite",
    label: "Founder invite",
    trigger: "Sent by hand to people who onboarded and never scanned",
    expectation: { kind: "manual" },
  },
];

export type EmailStatus = "ok" | "silent" | "never" | "quiet" | "manual";

export interface EmailRow extends EmailDefinition {
  lastSent: string | null;
  daysSinceLastSent: number | null;
  sent24h: number;
  sent7d: number;
  sent30d: number;
  status: EmailStatus;
  failures30d: number;
}

export interface EmailFailure {
  kind: string;
  userId: string | null;
  recipient: string | null;
  error: string;
  createdAt: string;
}

export interface EmailHealth {
  /** How far back the ledger was read. Anything older is not counted here. */
  windowDays: number;
  rows: EmailRow[];
  /** Campaign keys in the ledger that no registry entry claims. */
  unregistered: { campaign: string; sent: number; lastSent: string }[];
  failures: EmailFailure[];
  failureCounts: { kind: string; count: number }[];
  /**
   * The check that would have caught the September outage on day one: the
   * founder check-in fires two hours after every welcome, unconditionally, so
   * welcomes without check-ins behind them means the event never arrived.
   */
  sequence: { welcomes7d: number; checkins7d: number; broken: boolean };
}

const WINDOW_DAYS = 90;

/**
 * Strip the part of a campaign key that varies per send.
 *
 * Recurring emails carry a date, a month, an ISO week or a milestone in their
 * key, because `email_broadcast_log` is keyed on (campaign, user_id) and a
 * fixed key would let only the first send ever be recorded. The day number on
 * the community email is deliberately NOT stripped: day 2 and day 7 are two
 * different emails to the reader and are counted separately here.
 */
/**
 * Families whose key ends in an opaque id rather than a date or a number.
 *
 * `signal-closed-<signal uuid>` is one row per signal, so the suffix matches
 * none of the patterns below and the fold has to be by prefix. Without this
 * every send became its own family, the registry row stayed on "never sent"
 * for ever, and the page would have reported the most important email in the
 * set as broken while it was working.
 */
const ID_SUFFIX_FAMILIES = ["signal-closed"];

export function campaignFamily(campaign: string): string {
  for (const family of ID_SUFFIX_FAMILIES) {
    if (campaign.startsWith(`${family}-`)) return family;
  }
  return campaign
    .replace(/-\d{4}-W\d{2}$/, "")
    .replace(/-\d{4}-\d{2}-\d{2}$/, "")
    .replace(/-\d{4}-\d{2}$/, "")
    .replace(/-\d+$/, "");
}

function statusFor(
  expectation: Expectation,
  lastSent: string | null,
  daysSince: number | null,
): EmailStatus {
  if (expectation.kind === "manual") return "manual";
  if (expectation.kind === "conditional") return lastSent ? "ok" : "quiet";
  if (!lastSent) return "never";
  return daysSince !== null && daysSince > expectation.maxSilentDays
    ? "silent"
    : "ok";
}

export async function getEmailHealth(
  supabase: SupabaseClient,
): Promise<EmailHealth> {
  const now = Date.now();
  const since = (days: number) =>
    new Date(now - days * 86_400_000).toISOString();

  const [ledger, failureRows] = await Promise.all([
    supabase
      .from("email_broadcast_log")
      .select("campaign, sent_at")
      .gte("sent_at", since(WINDOW_DAYS))
      .order("sent_at", { ascending: false })
      .limit(20000),
    supabase
      .from("email_send_failures")
      .select("kind, user_id, recipient, error, created_at")
      .gte("created_at", since(30))
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const sends = (ledger.data ?? []) as { campaign: string; sent_at: string }[];
  const fails = (failureRows.data ?? []) as {
    kind: string;
    user_id: string | null;
    recipient: string | null;
    error: string;
    created_at: string;
  }[];

  const cut24h = since(1);
  const cut7d = since(7);
  const cut30d = since(30);

  interface Tally {
    last: string;
    c24: number;
    c7: number;
    c30: number;
  }
  const byFamily = new Map<string, Tally>();
  const byCampaign = new Map<string, { sent: number; last: string }>();

  for (const row of sends) {
    const family = campaignFamily(row.campaign);
    const tally = byFamily.get(family) ?? { last: row.sent_at, c24: 0, c7: 0, c30: 0 };
    if (row.sent_at > tally.last) tally.last = row.sent_at;
    if (row.sent_at >= cut24h) tally.c24++;
    if (row.sent_at >= cut7d) tally.c7++;
    if (row.sent_at >= cut30d) tally.c30++;
    byFamily.set(family, tally);

    const seen = byCampaign.get(row.campaign) ?? { sent: 0, last: row.sent_at };
    seen.sent++;
    if (row.sent_at > seen.last) seen.last = row.sent_at;
    byCampaign.set(row.campaign, seen);
  }

  const failuresByKind = new Map<string, number>();
  for (const f of fails) {
    failuresByKind.set(f.kind, (failuresByKind.get(f.kind) ?? 0) + 1);
  }

  const rows: EmailRow[] = EMAIL_REGISTRY.map((def) => {
    const tally = byFamily.get(def.family);
    const lastSent = tally?.last ?? null;
    const daysSince = lastSent
      ? Math.floor((now - Date.parse(lastSent)) / 86_400_000)
      : null;
    return {
      ...def,
      lastSent,
      daysSinceLastSent: daysSince,
      sent24h: tally?.c24 ?? 0,
      sent7d: tally?.c7 ?? 0,
      sent30d: tally?.c30 ?? 0,
      status: statusFor(def.expectation, lastSent, daysSince),
      failures30d: failuresByKind.get(def.family) ?? 0,
    };
  });

  const known = new Set(EMAIL_REGISTRY.map((d) => d.family));
  const unregistered = [...byCampaign.entries()]
    .filter(([campaign]) => !known.has(campaignFamily(campaign)))
    .map(([campaign, v]) => ({ campaign, sent: v.sent, lastSent: v.last }))
    .sort((a, b) => b.lastSent.localeCompare(a.lastSent));

  const welcomes7d = byFamily.get("sendWelcomeEmail")?.c7 ?? 0;
  const checkins7d = byFamily.get("sendFounderCheckin")?.c7 ?? 0;

  return {
    windowDays: WINDOW_DAYS,
    rows,
    unregistered,
    failures: fails.map((f) => ({
      kind: f.kind,
      userId: f.user_id,
      recipient: f.recipient,
      error: f.error,
      createdAt: f.created_at,
    })),
    failureCounts: [...failuresByKind.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => b.count - a.count),
    sequence: {
      welcomes7d,
      checkins7d,
      // Every welcome is followed by a check-in two hours later, with no
      // condition attached. Welcomes with no check-ins behind them means the
      // event that starts the delayed sequence is not arriving.
      broken: welcomes7d > 0 && checkins7d === 0,
    },
  };
}
